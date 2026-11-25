import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { requireOwner } from "@/lib/server/owner";
import { ProductEditForm } from "@/components/admin/forms";
import { VariantsEditor, PhotoManager } from "@/components/admin/product-editors";

export default function Page(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="ad-loading">Loading product…</div>}>
      <Product {...props} />
    </Suspense>
  );
}

async function Product({ params }: { params: Promise<{ id: string }> }) {
  const { db } = await requireOwner(); // owner-only: catalogue changes are public
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { data, error } = await db
    .from("products")
    .select("id,slug,name,summary,description,model,status,specs,variants(sku,name,units,min_qty,status,sort),product_media(id,url,alt,sort)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Could not load product");
  if (!data) notFound();
  const variants = [...(data.variants ?? [])].sort((a, b) => a.sort - b.sort);
  const media = [...(data.product_media ?? [])].sort((a, b) => a.sort - b.sort);
  return (
    <div className="ad-page">
      <Link className="ad-link ad-back" href="/admin/products"><ArrowLeft size={14} /> All products</Link>
      <header className="ad-head">
        <div>
          <h1>{data.name}</h1>
          <p>Changes go live on the public catalogue as soon as you save.</p>
        </div>
        <div className="ad-head-actions">
          <Link className="ad-btn" href={`/products/${data.slug}`}>View on website</Link>
        </div>
      </header>
      <section className="ad-card" aria-labelledby="details-title">
        <h2 id="details-title">Details and specifications</h2>
        <ProductEditForm product={data} />
      </section>
      <section className="ad-card" aria-labelledby="variants-title">
        <h2 id="variants-title">Variants</h2>
        <VariantsEditor productId={data.id} initial={variants} />
      </section>
      <section className="ad-card" aria-labelledby="photos-title">
        <h2 id="photos-title">Uploaded photos</h2>
        <PhotoManager productId={data.id} photos={media} />
      </section>
    </div>
  );
}
