"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SELECTOR = "[data-reveal]:not([data-shown])";

// Marks [data-reveal] elements as shown once they enter the viewport (play once).
// Also watches for elements streamed in after mount, which a one-off query would miss.
export function RevealObserver() {
  const path = usePathname();
  useEffect(() => {
    const showAll = matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window);
    const io = showAll
      ? null
      : new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (!e.isIntersecting) continue;
              (e.target as HTMLElement).dataset.shown = "";
              io!.unobserve(e.target);
            }
          },
          { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
        );
    const track = (root: ParentNode) =>
      root.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => (io ? io.observe(el) : (el.dataset.shown = "")));
    track(document);
    const mo = new MutationObserver((records) => {
      for (const r of records)
        for (const n of r.addedNodes)
          if (n instanceof HTMLElement) {
            if (n.matches(SELECTOR)) track(n.parentElement ?? n);
            else track(n);
          }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io?.disconnect();
      mo.disconnect();
    };
  }, [path]);
  return null;
}
