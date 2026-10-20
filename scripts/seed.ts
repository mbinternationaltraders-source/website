// Loads the seed catalog into Supabase. Usage: npm run seed (needs .env.local with the secret key).
// Re-running is safe: rows are upserted by slug/sku/key.
import { createClient } from "@supabase/supabase-js";
import { industries, products } from "../lib/catalog/seed";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key)
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local",
    );
  const db = createClient(url, key, { auth: { persistSession: false } });

  async function must<T>(
    q: PromiseLike<{ data: T | null; error: unknown }>,
  ): Promise<T> {
    const { data, error } = await q;
    if (error) throw error;
    if (data == null) throw new Error("empty response");
    return data;
  }

  const inds = await must(
    db
      .from("industries")
      .upsert(
        industries.map((i, sort) => ({
          ...i,
          guidance: i.guidance,
          sort,
          status: "published",
        })),
        { onConflict: "slug" },
      )
      .select("id, slug"),
  );
  const indId = new Map(
    inds.map((i: { id: string; slug: string }) => [i.slug, i.id]),
  );

  for (const [sort, p] of products.entries()) {
    const [row] = await must(
      db
        .from("products")
        .upsert(
          {
            slug: p.slug,
            family: p.family,
            name: p.name,
            model: p.model,
            model_note: p.modelNote,
            summary: p.summary,
            description: p.description,
            card_specs: p.cardSpecs,
            specs: p.specs,
            spec_note: p.specNote,
            sort,
            status: "published",
          },
          { onConflict: "slug" },
        )
        .select("id"),
    );
    await must(
      db
        .from("variants")
        .upsert(
          p.variants.map((v, i) => ({
            product_id: row.id,
            sku: v.sku,
            name: v.name,
            units: v.units,
            min_qty: v.minQty,
            sort: i,
          })),
          { onConflict: "sku" },
        )
        .select("id"),
    );
    await must(
      db
        .from("product_industries")
        .upsert(
          p.industries.map((s) => ({
            product_id: row.id,
            industry_id: indId.get(s),
          })),
          { onConflict: "product_id,industry_id" },
        )
        .select("product_id"),
    );
    console.log(`seeded ${p.slug}`);
  }
}
main().catch((error) => {
  console.error(
    "Catalog seed failed:",
    error instanceof Error ? error.message : "Database request failed",
  );
  process.exitCode = 1;
});
