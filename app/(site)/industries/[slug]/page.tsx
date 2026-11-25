import { Suspense } from "react";
import { PageLoader } from "@/components/page-loader";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalog, getIndustry } from "@/lib/catalog/data";
import { ProductCard } from "@/components/catalog/product-card";
import { Letters } from "@/components/motion";
import { metadataFor } from "@/lib/seo";
export async function generateStaticParams() {
  return (await getCatalog()).industries.map((i) => ({ slug: i.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const data = await getIndustry((await params).slug);
  // Resolved before the page streams, so an unknown slug gets a real 404 status, not a "soft 404".
  if (!data) notFound();
  return metadataFor(data.industry.name + " manufacturing", data.industry.intro, `/industries/${data.industry.slug}`);
}
async function IndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const data = await getIndustry((await params).slug);
  if (!data) notFound();
  const { industry, products } = data;
  return (
    <>
      <section className="container page-head">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/industries">Industries</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{industry.name}</span>
        </nav>
        <Letters as="h1" className="title-long" text={industry.headline} stagger={18} />
        <p>{industry.intro}</p>
      </section>
      <section className="container section-tight">
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
      <section className="container section" aria-labelledby="guide-title">
        <div className="section-head">
          <h2 id="guide-title">What to include in your enquiry</h2>
        </div>
        <ol className="steps">
          {industry.guidance.map((g, i) => (
            <li key={g.title}>
              <span className="step-no">{i + 1}</span>
              <h3>{g.title}</h3>
              <p>{g.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

export default function Page(props: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense
      fallback={<PageLoader />}
    >
      <IndustryPage {...props} />
    </Suspense>
  );
}
