"use client";
import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { usePreferences } from "./preferences";

// Muted looping video: nothing downloads until it is near the viewport (preload="none" + play on intersect),
// it pauses offscreen and in background tabs, and always has a pause control (WCAG 2.2.2).
export function LoopVideo({ sources, poster, label, className }: {
  sources: { src: string; media?: string }[];
  poster: string;
  label: string;
  className?: string;
}) {
  const { motionOff } = usePreferences();
  const video = useRef<HTMLVideoElement>(null);
  const [choice, setChoice] = useState<"play" | "pause" | null>(null);
  const playing = choice ? choice === "play" : !motionOff;

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (!playing) { v.pause(); return; }
    let onScreen = false;
    const sync = () => {
      if (onScreen && document.visibilityState === "visible")
        v.play().catch((e: DOMException) => e.name === "NotAllowedError" && setChoice("pause"));
      else v.pause();
    };
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); }, { rootMargin: "200px 0px" });
    io.observe(v);
    document.addEventListener("visibilitychange", sync);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", sync); };
  }, [playing]);

  return (
    <div className={`loop-video ${className ?? ""}`}>
      <video ref={video} poster={poster} muted loop playsInline preload="none" aria-label={label}>
        {sources.map((s) => <source key={s.src} src={s.src} media={s.media} type="video/mp4" />)}
      </video>
      <button
        type="button"
        className="loop-video-toggle"
        onClick={() => setChoice(playing ? "pause" : "play")}
        aria-label={playing ? `Pause video: ${label}` : `Play video: ${label}`}
      >
        {playing ? <Pause size={14} /> : <Play size={14} />}
      </button>
    </div>
  );
}
