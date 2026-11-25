import type { Product } from "./types";

// Spaces and dashes are ignored so "12V", "12 V" and "12-v" all match the same product.
const squash = (s: string) => s.toLowerCase().replace(/[\s\-–]+/g, "");

export function matchesSearch(p: Product, query: string) {
  const q = squash(query);
  if (!q) return true;
  // Buyers type plurals ("pumps", "timers"); also accept the singular form.
  const singular = q.length > 3 && q.endsWith("s") ? q.slice(0, -1) : q;
  const text = [
    p.name, p.model ?? "", p.summary, p.family,
    ...p.cardSpecs.filter((s) => !s.includes("to confirm")),
    ...p.specs.flatMap((s) => (s.value ? [s.label, s.value] : [])),
    ...p.variants.flatMap((v) => [v.sku, v.name]),
    ...p.industries, // "heater" finds every heater-industry part, not only names containing it
  ].join(" ");
  const haystack = squash(text);
  return haystack.includes(q) || haystack.includes(singular);
}
