import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireOwner } from "@/lib/server/owner";
import { ProductEditForm } from "@/components/admin/forms";
export default function Page(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="loading-shell">Loading product…</div>}>
      <Product {...props} />
    </Suspense>
  );
}
async function Product({ params }: { params: Promise<{ id: string }> }) {
  const { db } = await requireOwner();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { data, error } = await db
    .from("products")
    .select("id,name,summary,description,model,status,specs")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Could not load product");
  if (!data) notFound();
  return (
    <>
      <Link className="text-link" href="/admin/products">
        ← All products
      </Link>
      <h1 className="admin-title" style={{ marginTop: 24 }}>
        {data.name}
      </h1>
      <ProductEditForm product={data} />
      <p className="admin-notice">
        Variant and photo changes require a reviewed catalog update.
      </p>
    </>
  );
}
