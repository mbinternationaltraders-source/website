import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { hasSupabase, publicClient } from "@/lib/supabase/public";
import { industries as seedIndustries, products as seedProducts } from "./seed";
import type { Industry, Product } from "./types";

// Allowlisted public fields only (spec §2): no lead data, notes, costs or drafts reach rendering.
const PRODUCT_FIELDS = `slug, family, name, model, model_note, summary, description, card_specs, specs, spec_note,
  sort, updated_at,
  variants (sku, name, units, min_qty, sort),
  product_industries (industries (slug)),
  product_media (url, alt, sort, kind)`;

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function toProduct(r: Row): Product {
  const bySort = (a: Row, b: Row) => a.sort - b.sort;
  return {
    slug: r.slug,
    family: r.family,
    name: r.name,
    model: r.model,
    modelNote: r.model_note,
    summary: r.summary,
    description: r.description,
    cardSpecs: r.card_specs,
    specs: r.specs,
    specNote: r.spec_note,
    updatedAt: r.updated_at,
    // Owner-uploaded photos; the database only returns approved media of published products.
    media: [...(r.product_media ?? [])]
      .filter((m: Row) => m.kind === "photo")
      .sort(bySort)
      .map((m: Row) => ({ url: m.url, alt: m.alt })),
    industries: (r.product_industries ?? [])
      .map((pi: Row) => pi.industries?.slug)
      .filter(Boolean),
    variants: [...(r.variants ?? [])].sort(bySort).map((v: Row) => ({
      sku: v.sku,
      name: v.name,
      units: v.units,
      minQty: v.min_qty,
    })),
  };
}

export async function getCatalog(): Promise<{
  products: Product[];
  industries: Industry[];
}> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  if (!hasSupabase) {
    // shortcut: seed fallback so the site runs before Supabase keys exist; remove once production data is live.
    return { products: seedProducts, industries: seedIndustries };
  }
  const db = publicClient();
  const [p, i] = await Promise.all([
    db
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("status", "published")
      .order("sort"),
    db
      .from("industries")
      .select("slug, name, headline, intro, guidance")
      .eq("status", "published")
      .order("sort"),
  ]);
  if (p.error) throw p.error;
  if (i.error) throw i.error;
  return { products: p.data.map(toProduct), industries: i.data as Industry[] };
}

export async function getProduct(slug: string) {
  return (await getCatalog()).products.find((p) => p.slug === slug) ?? null;
}

export async function getIndustry(slug: string) {
  const { products, industries } = await getCatalog();
  const industry = industries.find((i) => i.slug === slug);
  return industry
    ? {
        industry,
        products: products.filter((p) => p.industries.includes(slug)),
      }
    : null;
}
