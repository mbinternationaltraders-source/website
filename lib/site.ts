// Business facts from the supplied blueprint. Spec §9: every value must be verified by the owner before launch.
export const site = {
  name: "MB International Traders",
  brand: "C3M",
  tagline: "Components for manufacturers.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  phoneDisplay: "+92 305 9617100",
  phoneE164: "+923059617100",
  whatsapp: "https://wa.me/923059617100",
  email: "mbintltraders@gmail.com",
  facebook: "https://facebook.com/mbintltraders",
  address: {
    plusCode: "54HX+FFV",
    street: "Opposite Puma Filling Station, Ali Pur Chowk, GT Road Bypass",
    locality: "Muhammadpura",
    city: "Gujranwala",
    postalCode: "52250",
    country: "PK",
  },
  hours: "9:00 AM – 5:00 PM Pakistan time",
  // shortcut: plus-code query embed, replace with the owner's verified Share → Embed URL (spec §9).
  mapEmbed:
    "https://www.google.com/maps?q=54HX%2BFFV%20Gujranwala&output=embed",
  directions:
    "https://www.google.com/maps/dir/?api=1&destination=54HX%2BFFV%2C%20Gujranwala%2052250",
  policiesEffective: "10 October 2026",
} as const;

export const addressLines = [
  site.address.street,
  site.address.locality,
  `${site.address.city} ${site.address.postalCode}`,
];

export function whatsappLink(text?: string) {
  return text
    ? `${site.whatsapp}?text=${encodeURIComponent(text)}`
    : site.whatsapp;
}
