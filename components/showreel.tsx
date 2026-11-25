"use client";
import Link from "next/link";
import { useRef, useState, type KeyboardEvent } from "react";
import { LoopVideo } from "./loop-video";
import { videoPoster, videoSources } from "@/lib/catalog/videos";

export type ReelItem = { slug: string; name: string; base: string; title: string; parts: string[]; accent: string };

// Home "Inside the parts": one large rounded video stage, coloured tabs to switch breakdowns,
// and a glass card naming the parts with a link to the product.
export function Showreel({ items }: { items: ReelItem[] }) {
  const [chosen, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  if (items.length === 0) return null;
  const active = Math.min(chosen, items.length - 1); // stays valid if the published list shrinks
  const item = items[active];
  // WAI-ARIA tabs: arrows/Home/End move focus and selection; only the active tab is in the Tab order.
  const onKey = (e: KeyboardEvent) => {
    const last = items.length - 1;
    const next = { ArrowRight: active === last ? 0 : active + 1, ArrowLeft: active === 0 ? last : active - 1, Home: 0, End: last }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  };
  return (
    <div className="reel" data-accent={item.accent}>
      <div className="reel-tabs" role="tablist" aria-label="Breakdown videos" onKeyDown={onKey}>
        {items.map((it, i) => (
          <button
            key={it.slug}
            type="button"
            role="tab"
            id={`reel-tab-${it.slug}`}
            ref={(el) => { tabs.current[i] = el; }}
            aria-selected={i === active}
            tabIndex={i === active ? 0 : -1}
            aria-controls="reel-stage"
            data-accent={it.accent}
            onClick={() => setActive(i)}
          >
            <span className="reel-dot" aria-hidden="true" />
            {it.name}
          </button>
        ))}
      </div>
      <div className="reel-stage" id="reel-stage" role="tabpanel" aria-labelledby={`reel-tab-${item.slug}`}>
        <LoopVideo key={item.base} sources={videoSources(item.base)} poster={videoPoster(item.base)} label={item.title} className="reel-video" />
        <div className="reel-card">
          <strong>{item.title}</strong>
          <ul>
            {item.parts.map((p) => <li key={p}>{p}</li>)}
          </ul>
          <Link href={`/products/${item.slug}`} prefetch className="reel-link">
            View {item.name.toLowerCase()} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
      <p className="reel-note">Breakdown animations show typical construction. Exact specifications are confirmed with your quotation.</p>
    </div>
  );
}
