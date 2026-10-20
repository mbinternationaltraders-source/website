"use client";
import Link from "next/link";
import { useState } from "react";
import { LoopVideo } from "./loop-video";
import { videoPoster, videoSources } from "@/lib/catalog/videos";

export type ReelItem = { slug: string; name: string; base: string; title: string; parts: string[]; accent: string };

// Home "Inside the parts": one large rounded video stage, coloured tabs to switch breakdowns,
// and a glass card naming the parts with a link to the product.
export function Showreel({ items }: { items: ReelItem[] }) {
  const [active, setActive] = useState(0);
  const item = items[active];
  return (
    <div className="reel" data-accent={item.accent}>
      <div className="reel-tabs" role="tablist" aria-label="Breakdown videos">
        {items.map((it, i) => (
          <button
            key={it.slug}
            type="button"
            role="tab"
            id={`reel-tab-${it.slug}`}
            aria-selected={i === active}
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
