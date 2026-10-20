"use client";
import { useEffect, useRef, type CSSProperties } from "react";
import { initials, type Testimonial } from "@/lib/proof";
import { LABELS, PINS_START, VB_H, VB_W, dist, dots, px, py, sx, sy } from "@/lib/region-map";
import { usePreferences } from "./preferences";

// Every dot pops in individually on a canvas, as one ripple out from Gujranwala across Pakistan and its
// neighbours; then customer pins pop in nearest-first. It replays each time the page is opened.
const COLORS = ["#cdcdcd", "#0a0a0a", "#2563eb"]; // neighbour, Pakistan, Gujranwala
const RADIUS = [7.4, 9.6, 9.6];
const POP_MS = 650;
const END_MS = Math.max(...dots.map((d) => d.d)) + POP_MS;
const backOut = (p: number, s: number) => 1 + (s + 1) * (p - 1) ** 3 + s * (p - 1) ** 2;

export function PakistanMap({ people }: { people: Testimonial[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const { motionOff } = usePreferences();

  useEffect(() => {
    const el = wrap.current, cv = canvas.current, ctx = cv?.getContext("2d");
    if (!el || !cv || !ctx) return;
    el.removeAttribute("data-shown"); // runs again whenever the page is shown, so the reveal replays
    let scale = 1, raf = 0, start = 0, t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (const d of dots) {
        const p = Math.min(1, (t - d.d) / POP_MS);
        if (p <= 0) continue;
        const r = RADIUS[d.kind] * backOut(p, d.kind ? 2.4 : 1.4) * scale;
        ctx.globalAlpha = Math.min(1, p * 3);
        ctx.fillStyle = COLORS[d.kind];
        ctx.beginPath();
        ctx.arc(d.x * scale, d.y * scale, Math.max(0, r), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(el.clientWidth * dpr);
      cv.height = Math.round(((el.clientWidth * VB_H) / VB_W) * dpr);
      scale = (el.clientWidth / VB_W) * dpr;
      draw();
    };
    const frame = (now: number) => {
      start ||= now;
      t = now - start;
      draw();
      if (t < END_MS) raf = requestAnimationFrame(frame);
    };
    const play = () => {
      el.dataset.shown = "";
      if (motionOff) { t = END_MS; draw(); return; }
      raf = requestAnimationFrame(frame);
    };

    size();
    const ro = new ResizeObserver(size);
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      play();
    }, { threshold: 0.2 });
    io.observe(el);
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); };
  }, [motionOff]);

  return (
    <div ref={wrap} className="pk-map" style={{ aspectRatio: `${VB_W} / ${VB_H}` }}>
      <canvas ref={canvas} aria-hidden="true" />
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} aria-hidden="true">
        {LABELS.map(([t, lon, lat]) => (
          <text key={t} x={sx(lon)} y={sy(lat)} className={t === "ARABIAN SEA" ? "pk-label pk-label-sea" : "pk-label"}>{t}</text>
        ))}
        {/* Atlas-style name printed along the country's diagonal. */}
        <text className="pk-print" transform={`translate(${sx(68.3)} ${sy(28.9)}) rotate(-52)`}>PAKISTAN</text>
      </svg>
      {[...people].sort((a, b) => dist(a.lon, a.lat) - dist(b.lon, b.lat)).map((p, i) => (
        <button
          key={p.name}
          type="button"
          className="pk-pin"
          data-tone={i % 6}
          style={{ left: `${px(p.lon)}%`, top: `${py(p.lat)}%`, "--d": `${PINS_START + i * 170}ms` } as CSSProperties}
          aria-label={`${p.name}, ${p.city}`}
        >
          <span className="pk-avatar" aria-hidden="true">{initials(p.name)}</span>
          <span className="pk-card" role="tooltip">
            <strong>{p.name}</strong>
            <small>{p.city}</small>
            <q>{p.quote}</q>
          </span>
        </button>
      ))}
    </div>
  );
}
