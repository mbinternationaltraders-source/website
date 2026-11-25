import Link from "next/link";
import { Suspense } from "react";
import { ownerOnlyContext } from "@/lib/server/dashboard";
import { products as seedProducts } from "@/lib/catalog/seed";

export default function Page() {
  return (
    <Suspense fallback={<div className="ad-loading">Loading products…</div>}>
      <Products />
    </Suspense>
  );
}

type Row = { id: string; slug: string; name: string; model: string | null; status: string; updated_at: string; specs: { value: string | null }[] };

async function Products() {
  const ctx = await ownerOnlyContext();
  let rows: Row[];
  if (ctx.demo) {
    rows = seedProducts.map((p) => ({ id: "", slug: p.slug, name: p.name, model: p.model, status: "published", updated_at: p.updatedAt, specs: p.specs }));
  } else {
    const { data, error } = await ctx.db.from("products").select("id,slug,name,model,status,updated_at,specs").order("sort");
    if (error) throw new Error("Could not load products");
    rows = data as Row[];
  }
  return (
    <div className="ad-page">
      <header className="ad-head">
        <div>
          <h1>Products</h1>
          <p>Draft and archived products are hidden from the public catalog.</p>
        </div>
      </header>
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Model</th>
              <th scope="col">Specs confirmed</th>
              <th scope="col">Status</th>
              <th scope="col">Updated</th>
              <th scope="col"><span className="sr-only">Preview</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const known = p.specs.filter((s) => s.value).length;
              return (
                <tr key={p.slug}>
                  <td>{p.id ? <Link className="ad-row-link" href={`/admin/products/${p.id}`}>{p.name}</Link> : p.name}</td>
                  <td>{p.model ?? <span className="ad-muted">To confirm</span>}</td>
                  {/* Completeness nudges the owner toward the specs buyers ask about most. */}
                  <td><span className="ad-chip" data-tone={known === p.specs.length ? "up" : known ? undefined : "down"}>{known} of {p.specs.length}</span></td>
                  <td><span className="ad-pill" data-status={p.status === "published" ? "won" : "lost"}>{p.status}</span></td>
                  <td>{new Date(p.updated_at).toLocaleDateString("en-GB")}</td>
                  <td><Link className="ad-link" href={`/products/${p.slug}`}>Preview</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
