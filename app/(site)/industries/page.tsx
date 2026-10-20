import Link from "next/link";
import { getCatalog } from "@/lib/catalog/data";
import { ProductPhoto } from "@/components/product-photo";
import { metadataFor } from "@/lib/seo";
import { Letters } from "@/components/motion";
export const metadata = metadataFor(
  "Industries we serve",
  "Find components for fan, washing machine, cooler, heater and kitchen appliance manufacturing.",
  "/industries",
);
export default async function Industries() {
  const { industries, products } = await getCatalog();
  return (
    <>
      <section className="container page-head">
        <Letters as="h1" text="Industries" />
        <p>
          Start with what you make. Each page lists the parts we supply for that
          appliance and what to tell us when you ask for a quote.
        </p>
      </section>
      <section className="container section-tight">
        <div className="industry-grid">
          {industries.map((i) => {
            const items = products.filter((p) => p.industries.includes(i.slug));
            return (
              <Link className="industry-card" href={`/industries/${i.slug}`} key={i.slug} data-accent={i.slug} prefetch>
                <div className="industry-card-photo">
                  {items[0] && <ProductPhoto product={items[0]} />}
                </div>
                <div>
                  <h2>{i.name}</h2>
                  <p>{i.intro}</p>
                  <span className="industry-card-meta">
                    {items.length} {items.length === 1 ? "product" : "products"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
