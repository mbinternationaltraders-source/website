"use client";
import type { CSSProperties } from "react";
import { usePathname } from "next/navigation";

// Branded route loader. Research basis (NN/g): show nothing for sub-second waits, a looped indicator
// with context for longer ones. So it only appears after 400ms, assembles an MB ball bearing
// (race draws, balls drop in, hub pops, balls roll), names the destination and rotates true facts.
const BALLS = 8;
const FACTS = [
  "Price, minimum order and delivery are confirmed in your quotation",
  "Send a photo of any part on WhatsApp and we will match it",
  "Pumps, motors, bearings, timers and heating parts in one quote list",
  "Supplying appliance makers from Gujranwala",
];

const words: Record<string, string> = { ac: "AC", dc: "DC", lh1020: "LH1020" };
function destination(path: string) {
  const [section, slug] = path.split("/").filter(Boolean);
  if (!section) return "Home";
  const name = (slug ?? section).split("-").map((w) => words[w] ?? w).join(" ");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function PageLoader() {
  const label = destination(usePathname() ?? "/");
  return (
    <div className="page-loader" role="status">
      <svg viewBox="0 0 120 120" className="loader-bearing" aria-hidden="true">
        <circle cx="60" cy="60" r="54" className="loader-outer" pathLength={1} />
        <circle cx="60" cy="60" r="44" className="loader-track" />
        <g className="loader-balls">
          {Array.from({ length: BALLS }, (_, i) => {
            const a = (i / BALLS) * Math.PI * 2;
            return (
              <circle key={i} cx={60 + Math.cos(a) * 36} cy={60 + Math.sin(a) * 36} r="7"
                style={{ "--i": i } as CSSProperties} />
            );
          })}
        </g>
        <g className="loader-hub">
          <circle cx="60" cy="60" r="27" />
          <text x="60" y="60">MB</text>
        </g>
      </svg>
      <p className="loader-dest">Opening <strong>{label}</strong></p>
      <div className="loader-facts" aria-hidden="true">
        <ul>{[...FACTS, FACTS[0]].map((f, i) => <li key={i}>{f}</li>)}</ul>
      </div>
      <span className="sr-only">Loading {label}</span>
    </div>
  );
}
