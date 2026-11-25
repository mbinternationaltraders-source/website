import { Suspense } from "react";
import { PageLoader } from "@/components/page-loader";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalog, getProduct } from "@/lib/catalog/data";
import { ProductDetail } from "@/components/catalog/product-detail";
import { ProductCard } from "@/components/catalog/product-card";
import { metadataFor, jsonLd } from "@/lib/seo";
import { site } from "@/lib/site";
export async function generateStaticParams() {
  return (await getCatalog()).products.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = await getProduct((await params).slug);
  // Resolved before the page streams, so an unknown slug gets a real 404 status, not a "soft 404".
  if (!p) notFound();
  return metadataFor(p.name, describe(`${p.summary} ${p.description}`), `/products/${p.slug}`);
}
async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  const { products, industries } = await getCatalog();
  const related = products
    .filter(
      (p) =>
        p.slug !== product.slug &&
        p.industries.some((i) => product.industries.includes(i)),
    )
    .slice(0, 4);
  return (
    <>
      <section className="container product-page">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/products">Products</Link>
          <span>/</span>
          <span aria-current="page">{product.name}</span>
        </nav>
        <ProductDetail product={product} industries={industries} />
      </section>
      {related.length > 0 && (
        <section className="container section">
          <div className="section-head">
            <h2>Often quoted together</h2>
            <Link className="text-link" href="/products">
              View all products
            </Link>
          </div>
          <div className="product-grid">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.summary,
            url: `${site.url}/products/${product.slug}`,
            brand: { "@type": "Brand", name: "C3M" },
            ...(product.model ? { model: product.model } : {}),
            additionalProperty: product.specs
              .filter((s) => s.value)
              .map((s) => ({
                "@type": "PropertyValue",
                name: s.label,
                value: s.value,
              })),
          }),
        }}
      />
    </>
  );
}

export default function Page(props: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense
      fallback={<PageLoader />}
    >
      <ProductPage {...props} />
    </Suspense>
  );
}

// Search snippets: up to ~160 characters, cut at a word boundary.
function describe(text: string) {
  if (text.length <= 160) return text;
  const cut = text.slice(0, 157);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}
