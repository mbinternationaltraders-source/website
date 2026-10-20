import Link from "next/link";
import { Suspense } from "react";
import { requireOwner } from "@/lib/server/owner";
export default function Page() {
  return (
    <Suspense fallback={<div className="loading-shell">Loading products…</div>}>
      <Products />
    </Suspense>
  );
}
async function Products() {
  const { db } = await requireOwner();
  const { data, error } = await db
    .from("products")
    .select("id,slug,name,model,status,updated_at")
    .order("sort");
  if (error) throw new Error("Could not load products");
  return (
    <>
      <span className="eyebrow">OWNER / CATALOG</span>
      <h1 className="admin-title" style={{ marginTop: 17 }}>
        Product collection.
      </h1>
      <p className="admin-notice">
        Confirm specifications and product representations before publication.
        Draft and archived items are excluded from the public catalog.
      </p>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Model</th>
              <th>Status</th>
              <th>Last updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/admin/products/${p.id}`}>{p.name}</Link>
                </td>
                <td>{p.model || "To confirm"}</td>
                <td>{p.status}</td>
                <td>{new Date(p.updated_at).toLocaleDateString("en-GB")}</td>
                <td>
                  <Link href={`/products/${p.slug}`}>Preview</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
