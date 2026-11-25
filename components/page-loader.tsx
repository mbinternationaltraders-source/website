"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { usePreferences } from "./preferences";

// Branded route loader: a particle sphere slowly turning on the page background. Research basis (NN/g): show nothing
// for sub-second waits (it fades in after 400ms), then a looped indicator with context for longer ones.
const FACTS = [
  "Price, minimum order and delivery are confirmed in your quotation",
  "Send a photo of any part on WhatsApp and we will match it",
  "Pumps, motors, bearings, timers and heating parts in one quote list",
  "Supplying appliance makers from Gujranwala",
];
const SLOW_MS = 10_000; // after this, offer a way out instead of an indefinite spinner

const words: Record<string, string> = { ac: "AC", dc: "DC", lh1020: "LH1020" };
function destination(path: string) {
  const [section, slug] = path.split("/").filter(Boolean);
  if (!section) return "Home";
  const name = (slug ?? section).split("-").map((w) => words[w] ?? w).join(" ");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Randomly scattered points on a sphere (a regular lattice looks mechanical), a soft radial jitter for
// the dusty edge, and extra points in the polar caps for the bright top and bottom of the reference.
// Seeded so the pattern never re-shuffles between visits.
function makePoints(n: number) {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const pts: [number, number, number][] = [];
  const add = (y: number, k: number) => {
    const r = Math.sqrt(1 - y * y), t = rand() * Math.PI * 2;
    pts.push([Math.cos(t) * r * k, y * k, Math.sin(t) * r * k]);
  };
  for (let i = 0; i < n; i++) add(rand() * 2 - 1, 0.9 + rand() * 0.14); // uniform y gives uniform area
  for (let i = 0; i < n * 0.15; i++) add((rand() < 0.5 ? -1 : 1) * (0.88 + rand() * 0.12), 0.97 + rand() * 0.05);
  return pts;
}

function ParticleSphere() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { motionOff } = usePreferences();
  useEffect(() => {
    const cv = ref.current, ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const pts = makePoints(3000);
    const colour = getComputedStyle(cv).color; // follows the page text colour (dark on the light site)
    const still = motionOff || matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tilt = 0.42, ct = Math.cos(tilt), st = Math.sin(tilt);
    let raf = 0, angle = 0.6, last = 0;
    const draw = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2), w = cv.clientWidth;
      if (cv.width !== Math.round(w * dpr)) cv.width = cv.height = Math.round(w * dpr);
      const R = cv.width * 0.4, c = cv.width / 2, ca = Math.cos(angle), sa = Math.sin(angle);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = colour;
      for (const [x, y, z] of pts) {
        const x1 = x * ca + z * sa, z1 = -x * sa + z * ca; // spin about the vertical axis
        const y2 = y * ct - z1 * st, z2 = y * st + z1 * ct; // tilt toward the viewer
        const depth = (z2 + 1) / 2; // 0 back … 1 front
        ctx.globalAlpha = 0.15 + depth * 0.75;
        const s = (0.45 + depth * 0.8) * dpr;
        ctx.fillRect(c + x1 * R, c - y2 * R, s, s);
      }
      ctx.globalAlpha = 1;
    };
    const frame = (now: number) => {
      angle += Math.min(50, now - (last || now)) * 0.00025; // about one turn every 25 s
      last = now;
      draw();
      raf = requestAnimationFrame(frame);
    };
    draw();
    if (!still) raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [motionOff]);
  return <canvas ref={ref} className="loader-sphere" aria-hidden="true" />;
}

export function PageLoader() {
  const label = destination(usePathname() ?? "/");
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setSlow(true), SLOW_MS);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className="page-loader" role="status">
      <ParticleSphere />
      <p className="loader-dest">Opening <strong>{label}</strong></p>
      <div className="loader-facts" aria-hidden="true">
        <ul>{[...FACTS, FACTS[0]].map((f, i) => <li key={i}>{f}</li>)}</ul>
      </div>
      {slow && (
        <div className="loader-slow">
          <p>This is taking longer than usual.</p>
          <button type="button" className="pill pill-dark pill-small" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      )}
      <span className="sr-only">Loading {label}</span>
    </div>
  );
}
