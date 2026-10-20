"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { usePreferences } from "./preferences";
import { Letters, Rise } from "./motion";

// Nixtio-style hero: rounded frame, full-bleed looping video, giant wordmark, facts row.
// Seconds where the clip turns dark behind the headline (measured from the frames); text flips to white there.
const DARK: [number, number][] = [[5.45, 6.8]];

export function HomeHero({ productCount, industryCount }: { productCount: number; industryCount: number }) {
  const { motionOff } = usePreferences();
  const video = useRef<HTMLVideoElement>(null);
  const hero = useRef<HTMLElement>(null);

  // Frame-accurate when the browser supports it, otherwise on timeupdate. Sets an attribute, no re-render.
  useEffect(() => {
    const v = video.current, h = hero.current;
    if (!v || !h) return;
    const check = () => h.toggleAttribute("data-dark", DARK.some(([a, b]) => v.currentTime >= a && v.currentTime < b));
    if (typeof v.requestVideoFrameCallback === "function") {
      let id = 0;
      const loop = () => { check(); id = v.requestVideoFrameCallback(loop); };
      id = v.requestVideoFrameCallback(loop);
      v.addEventListener("seeked", check);
      return () => { v.cancelVideoFrameCallback(id); v.removeEventListener("seeked", check); };
    }
    v.addEventListener("timeupdate", check);
    return () => v.removeEventListener("timeupdate", check);
  }, []);
  // The visitor's own play/pause choice wins; otherwise motion-off keeps the poster still.
  const [choice, setChoice] = useState<"play" | "pause" | null>(null);
  const playing = choice ? choice === "play" : !motionOff;

  // Runs only while wanted, on screen and in a visible tab (spec §7: no offscreen playback).
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (!playing) {
      v.pause();
      return;
    }
    let onScreen = true;
    const sync = () => {
      if (onScreen && document.visibilityState === "visible")
        // Only a real autoplay block (e.g. iOS Low Power Mode) falls back to the poster; background-tab aborts retry.
        v.play().catch((e: DOMException) => e.name === "NotAllowedError" && setChoice("pause"));
      else v.pause();
    };
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    io.observe(v);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [playing]);

  return (
    <section ref={hero} className="hero" aria-labelledby="hero-title">
      <video
        ref={video}
        className="hero-video"
        poster="/images/hero/motor-poster.webp"
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        tabIndex={-1}
      >
        {/* AI-upscaled master (Apple super-resolution), encoded per screen size; phones get the light 720p. */}
        <source src="/videos/hero-motor-1440.mp4" type="video/mp4" media="(min-width: 1200px)" />
        <source src="/videos/hero-motor-1080.mp4" type="video/mp4" media="(min-width: 769px)" />
        <source src="/videos/hero-motor-720.mp4" type="video/mp4" />
      </video>
      <div className="hero-content">
        <Letters as="h1" id="hero-title" text="Built to run" className="hero-title" delay={150} stagger={45} />
        <div className="hero-bottom">
          <Rise delay={650} className="hero-facts">
            <span>{productCount} products</span>
            <span>{industryCount} industries</span>
            <span>Gujranwala, Pakistan</span>
          </Rise>
          <Rise delay={780} className="hero-intro">
            <p className="hero-lede">
              <strong>Pumps, motors, bearings, timers and heating parts for appliance makers.</strong>{" "}
              Build a quote list and we confirm price, minimum order and delivery with you.
            </p>
            <div className="hero-actions">
              <Link className="pill pill-dark" href="/quote">Request a quote</Link>
              <Link className="pill pill-light" href="/products">Browse products</Link>
            </div>
          </Rise>
        </div>
      </div>
      <button
        type="button"
        className="hero-toggle"
        onClick={() => setChoice(playing ? "pause" : "play")}
        aria-label={playing ? "Pause background video" : "Play background video"}
      >
        {playing ? <Pause size={14} /> : <Play size={14} />}
      </button>
    </section>
  );
}
