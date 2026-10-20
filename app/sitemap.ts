import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/catalog/data";
import { site } from "@/lib/site";
import { testimonials } from "@/lib/proof";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, industries } = await getCatalog();
  return [
    ...[
      "",
      "/products",
      "/industries",
      "/about",
      "/contact",
      "/privacy",
      "/terms",
      "/cookies",
      "/accessibility",
      ...(testimonials.length ? ["/testimonials"] : []),
    ].map((path) => ({ url: site.url + path })),
    ...products.map((p) => ({
      url: `${site.url}/products/${p.slug}`,
      lastModified: p.updatedAt,
    })),
    ...industries.map((i) => ({ url: `${site.url}/industries/${i.slug}` })),
  ];
}
