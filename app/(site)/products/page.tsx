import { getCatalog } from "@/lib/catalog/data";
import { CatalogBrowser } from "@/components/catalog/catalog-browser";
import { metadataFor } from "@/lib/seo";
import { Letters } from "@/components/motion";
export const metadata = metadataFor(
  "Product catalog",
  "Explore motors, pumps, ball bearings, timers and heating components. Find a component and add it to your business quotation.",
  "/products",
);
export default async function Catalog() {
  const catalog = await getCatalog();
  return (
    <>
      <section className="container page-head">
        <Letters as="h1" text="Products" />
        <p>
          Motors, pumps, bearings, timers, switches and heating parts. Add what
          you need to your quote list and we’ll confirm price and delivery.
        </p>
      </section>
      <section className="container section-tight">
        <CatalogBrowser {...catalog} />
      </section>
    </>
  );
}
