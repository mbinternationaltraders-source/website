// Social proof. Clients are confirmed by the owner (keep order records on file).
// Testimonials marked `sample` are design placeholders: they render with a "Sample" tag
// and are removed automatically once NEXT_PUBLIC_LAUNCH_READY=true. Replace them with
// real quotes (with the customer's permission) before launch.

// Logos come from each client's own website, re-encoded to WebP in /public/images/clients.
export type Client = { name: string; short: string; area: string; makes: string; logo: string; w: number; h: number };

export const clients: Client[] = [
  { name: "Allied Home Appliances", short: "Allied", area: "Small Industrial Estate 3", makes: "Coolers, washing machines", logo: "/images/clients/allied.webp", w: 219, h: 132 },
  { name: "United Home Appliances", short: "United", area: "Climaxabad, GT Road", makes: "Coolers, washers, dryers", logo: "/images/clients/united.webp", w: 265, h: 132 },
  { name: "Toyo Industries", short: "Toyo", area: "Small Industrial Estate 2", makes: "Coolers, washing machines", logo: "/images/clients/toyo.webp", w: 420, h: 109 },
  { name: "RG Home Appliances", short: "RG", area: "Gondlanwala Road", makes: "Coolers, washers, dryers", logo: "/images/clients/rg.webp", w: 283, h: 132 },
  { name: "Shaheen Fans", short: "Shaheen", area: "GT Road", makes: "Fans, coolers, washers", logo: "/images/clients/shaheen.webp", w: 330, h: 132 },
  { name: "3 Star Metro", short: "3 Star", area: "Small Industrial Estate 2", makes: "Coolers, washing machines", logo: "/images/clients/3star.webp", w: 233, h: 132 },
  { name: "BOSS Home Appliances", short: "BOSS", area: "Small Industrial Estate 1", makes: "Coolers, washers, dryers", logo: "/images/clients/boss.webp", w: 223, h: 132 },
  { name: "Super Asia", short: "Super Asia", area: "GT Road", makes: "Coolers, fans, washers", logo: "/images/clients/superasia.webp", w: 380, h: 132 },
  { name: "Nagina Pumps", short: "Nagina", area: "Climaxabad, GT Road", makes: "Motors and pumps", logo: "/images/clients/nagina.webp", w: 420, h: 73 },
  { name: "Diamond Motors & Pumps", short: "Diamond", area: "Gondlawala Road", makes: "Motors and pumps", logo: "/images/clients/diamond.webp", w: 132, h: 132 },
];

export type Testimonial = {
  name: string;
  role: string;
  city: string;
  lon: number;
  lat: number;
  quote: string;
  sample: boolean;
};

// Sample quotes are deliberately not attributed to any real company.
const all: Testimonial[] = [
  { name: "Usman Tariq", role: "Production manager, cooler assembly", city: "Gujranwala", lon: 74.19, lat: 32.16, sample: true,
    quote: "Pumps arrive boxed and tested, and when a batch spec changed they told us before dispatch, not after." },
  { name: "Ayesha Siddiqui", role: "Purchasing lead, appliance maker", city: "Lahore", lon: 74.35, lat: 31.55, sample: true,
    quote: "One quote list for timers, capacitors and bearings saved us three separate supplier calls every month." },
  { name: "Bilal Ahmed", role: "Owner, motor rewinding workshop", city: "Faisalabad", lon: 73.08, lat: 31.42, sample: true,
    quote: "I sent a photo of an old fan motor on WhatsApp and they matched the replacement the same day." },
  { name: "Hamza Qureshi", role: "Plant engineer, washer line", city: "Peshawar", lon: 71.58, lat: 34.01, sample: true,
    quote: "Clear specifications, honest lead times and no surprises on minimum order. That is all we ask for." },
  { name: "Sana Malik", role: "Sourcing officer, heater manufacturer", city: "Karachi", lon: 67.01, lat: 24.86, sample: true,
    quote: "Heating elements matched our drawings and the quotation listed exactly what we had asked for." },
  { name: "Imran Javed", role: "Operations head, spare parts trader", city: "Multan", lon: 71.47, lat: 30.2, sample: true,
    quote: "Fast replies, careful packing and they follow up until the order is settled." },
  { name: "Faisal Mehmood", role: "Maintenance lead, appliance service centre", city: "Islamabad", lon: 73.05, lat: 33.68, sample: true,
    quote: "We restock switches and timers from them. Every part comes labelled with the model we asked for." },
];

export const showSamples = process.env.NEXT_PUBLIC_LAUNCH_READY !== "true";
export const testimonials = all.filter((t) => !t.sample || showSamples);

export const initials = (name: string) =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
