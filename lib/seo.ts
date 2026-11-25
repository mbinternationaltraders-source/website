import type { Metadata } from "next";
import { site } from "./site";
export function metadataFor(
  title: string,
  description: string,
  path: string,
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | ${site.name}`,
      description,
      url: path,
      type: "website",
      siteName: site.name,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: "MB International Traders — Components for manufacturers",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  };
}

// Serialise structured data for a <script type="application/ld+json"> block. "<" becomes the JSON
// escape <, so catalogue text containing "</script>" can never end the script tag (stored XSS).
export const jsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");
