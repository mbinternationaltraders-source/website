import { getCatalog } from "@/lib/catalog/data";
import { QuoteBasket } from "@/components/quote-basket";
import { metadataFor } from "@/lib/seo";
import { Letters } from "@/components/motion";
export const metadata = {
  ...metadataFor(
    "Your quotation",
    "Review your components and quantities, then send your requirements to MB International Traders.",
    "/quote",
  ),
  robots: { index: false, follow: true },
};
export default async function Quote() {
  const { products } = await getCatalog();
  return (
    <>
      <section className="container page-head">
        <Letters as="h1" text="Your quote list" />
        <p>
          Check quantities, add notes and tell us how to reach you. We’ll reply
          with price, minimum order and delivery. Nothing is ordered until you
          agree.
        </p>
      </section>
      <section className="container section-tight">
        <QuoteBasket products={products} />
      </section>
    </>
  );
}
