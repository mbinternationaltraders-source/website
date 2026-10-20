// AI super-resolution of a video using Apple's VideoToolbox VTSuperResolutionScaler (macOS 26).
// Build: swiftc -O scripts/upscale-video/main.swift -o /tmp/upscale   (macOS 26+, Apple silicon)
// Usage: /tmp/upscale <input.mp4> <master.mov> 2560 1440   then encode web sizes with ffmpeg (see README).
// The first run asks macOS to download Apple's super-resolution model.
import AVFoundation
import CoreVideo
import Foundation
import VideoToolbox

func fail(_ msg: String) -> Never { FileHandle.standardError.write((msg + "\n").data(using: .utf8)!); exit(1) }

let args = CommandLine.arguments
guard args.count == 5, let outW = Int(args[3]), let outH = Int(args[4]) else { fail("usage: upscale in out w h") }
let inURL = URL(fileURLWithPath: args[1]), outURL = URL(fileURLWithPath: args[2])

func makePool(_ attrs: [String: Any]) -> CVPixelBufferPool {
    var pool: CVPixelBufferPool?
    CVPixelBufferPoolCreate(nil, nil, attrs as CFDictionary, &pool)
    guard let pool else { fail("pool creation failed for \(attrs)") }
    return pool
}
func newBuffer(_ pool: CVPixelBufferPool) -> CVPixelBuffer {
    var b: CVPixelBuffer?
    CVPixelBufferPoolCreatePixelBuffer(nil, pool, &b)
    guard let b else { fail("buffer allocation failed") }
    return b
}

let asset = AVURLAsset(url: inURL)
guard let track = try await asset.loadTracks(withMediaType: .video).first else { fail("no video track") }
let size = try await track.load(.naturalSize)
let (w, h) = (Int(size.width), Int(size.height))

guard let config = VTSuperResolutionScalerConfiguration(
    frameWidth: w, frameHeight: h, scaleFactor: 4, inputType: .video, usePrecomputedFlow: false,
    qualityPrioritization: .normal, revision: VTSuperResolutionScalerConfiguration.defaultRevision)
else { fail("super-resolution not available for \(w)x\(h)") }

if config.configurationModelStatus != .ready {
    print("Downloading Apple super-resolution model…")
    try await config.downloadConfigurationModel()
    while config.configurationModelStatus != .ready {
        print(String(format: "  model %.0f%%", config.configurationModelPercentageAvailable * 100))
        try await Task.sleep(nanoseconds: 1_000_000_000)
    }
    print("Model ready.")
}

let processor = VTFrameProcessor()
try processor.startSession(configuration: config)
defer { processor.endSession() }

let srcPool = makePool(config.sourcePixelBufferAttributes)
let dstPool = makePool(config.destinationPixelBufferAttributes)
let outPool = makePool([
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
    kCVPixelBufferWidthKey as String: outW, kCVPixelBufferHeightKey as String: outH,
    kCVPixelBufferIOSurfacePropertiesKey as String: [:] as [String: Any],
])

var transfer: VTPixelTransferSession?
VTPixelTransferSessionCreate(allocator: nil, pixelTransferSessionOut: &transfer)
guard let transfer else { fail("transfer session failed") }

let reader = try AVAssetReader(asset: asset)
let output = AVAssetReaderTrackOutput(track: track, outputSettings: [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
    kCVPixelBufferIOSurfacePropertiesKey as String: [:] as [String: Any],
])
reader.add(output)
guard reader.startReading() else { fail("reader failed: \(String(describing: reader.error))") }

try? FileManager.default.removeItem(at: outURL)
let writer = try AVAssetWriter(outputURL: outURL, fileType: .mov)
let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.hevc, AVVideoWidthKey: outW, AVVideoHeightKey: outH,
    // Near-lossless intermediate; ffmpeg makes the final web encodes from it.
    AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 60_000_000, AVVideoQualityKey: 0.95] as [String: Any],
])
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: nil)
writer.add(input)
writer.startWriting()
writer.startSession(atSourceTime: .zero)

var prevSource: VTFrameProcessorFrame?
var prevOutput: VTFrameProcessorFrame?
var count = 0
let started = Date()

while let sample = output.copyNextSampleBuffer() {
    guard let decoded = CMSampleBufferGetImageBuffer(sample) else { continue }
    let pts = CMSampleBufferGetPresentationTimeStamp(sample)

    let src = newBuffer(srcPool)
    guard VTPixelTransferSessionTransferImage(transfer, from: decoded, to: src) == noErr else { fail("to-source transfer failed") }
    let dst = newBuffer(dstPool)
    guard let srcFrame = VTFrameProcessorFrame(buffer: src, presentationTimeStamp: pts),
          let dstFrame = VTFrameProcessorFrame(buffer: dst, presentationTimeStamp: pts),
          let params = VTSuperResolutionScalerParameters(
            sourceFrame: srcFrame, previousFrame: prevSource, previousOutputFrame: prevOutput, opticalFlow: nil,
            submissionMode: prevSource == nil ? .random : .sequential, destinationFrame: dstFrame)
    else { fail("could not build parameters") }

    let err: Error? = await withCheckedContinuation { cont in
        processor.process(parameters: params) { _, error in cont.resume(returning: error) }
    }
    if let err { fail("process error: \(err)") }

    let out = newBuffer(outPool)
    guard VTPixelTransferSessionTransferImage(transfer, from: dst, to: out) == noErr else { fail("downscale failed") }
    while !input.isReadyForMoreMediaData { try await Task.sleep(nanoseconds: 2_000_000) }
    guard adaptor.append(out, withPresentationTime: pts) else { fail("append failed: \(String(describing: writer.error))") }

    prevSource = srcFrame
    prevOutput = dstFrame
    count += 1
    if count % 24 == 0 { print("  \(count) frames, \(Int(Date().timeIntervalSince(started)))s") }
}

input.markAsFinished()
await writer.finishWriting()
guard writer.status == .completed else { fail("writer failed: \(String(describing: writer.error))") }
print("Done: \(count) frames → \(outW)x\(outH) in \(Int(Date().timeIntervalSince(started)))s")
