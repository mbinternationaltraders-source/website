import type { LeadRow, LeadStatus } from "./stats";

// Local preview data so the owner dashboard can be designed and reviewed before Supabase is connected.
// Only reachable when NODE_ENV is not "production" AND Supabase is unconfigured (see lib/server/owner.ts).
// Names are fictional; nothing here is written anywhere.
const people: [string, string | null, string][] = [
  ["Usman Tariq", "Tariq Cool Air", "Gujranwala"], ["Ayesha Siddiqui", "Siddiqui Appliances", "Lahore"],
  ["Bilal Ahmed", null, "Faisalabad"], ["Hamza Qureshi", "Qureshi Washers", "Peshawar"],
  ["Sana Malik", "Malik Heaters", "Karachi"], ["Imran Javed", "Javed Spares", "Multan"],
  ["Faisal Mehmood", "Service Point", "Islamabad"], ["Zainab Ali", "Ali Fans", "Gujrat"],
  ["Kashif Raza", "Raza Industries", "Sialkot"], ["Nadia Hussain", null, "Rawalpindi"],
  ["Omar Farooq", "Farooq Electric", "Gujranwala"], ["Hina Shah", "Shah Home", "Lahore"],
];
const items = [
  ["Water cooler pump", "LH1020", 500], ["Capacitors", "To confirm", 1000], ["Ball bearings", "To confirm", 2000],
  ["Washing machine timer", "Standard", 300], ["Mini fan motor, DC geared", "DC geared", 250],
  ["Geyser element", "To confirm", 120], ["Washer buttons and switches", "3-position", 800],
] as const;
const statuses: LeadStatus[] = ["new", "new", "new", "contacted", "quoted", "quoted", "won", "lost", "contacted", "won"];

export function demoLeads(now = Date.now()): LeadRow[] {
  return Array.from({ length: 46 }, (_, i) => {
    const [name, company, city] = people[i % people.length];
    const created = now - (i * 1.7 + (i % 3) * 0.4) * 86_400_000 - (i % 5) * 3_600_000;
    const status = statuses[i % statuses.length];
    const replyHours = [0.6, 2, 5, 11, 26][i % 5];
    return {
      id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
      reference: `MB-2610-${String(146 - i).padStart(4, "0")}`,
      name, company, kind: i % 6 === 5 ? "contact" : "quote", status,
      preferred_contact: ["whatsapp", "phone", "email"][i % 3], delivery_city: city,
      created_at: new Date(created).toISOString(),
      first_response_at: status === "new" ? null : new Date(created + replyHours * 3_600_000).toISOString(),
      deal_value: status === "new" ? null : [85_000, 240_000, 1_150_000, 62_500, 410_000][i % 5],
      follow_up_at: status === "contacted" || status === "quoted" ? new Date(now + ((i % 7) - 3) * 86_400_000).toISOString() : null,
      source: (["website", "google", "whatsapp", "referral", "repeat", "website", "facebook"] as const)[i % 7],
      phone: `0300 12345${String(i % people.length).padStart(2, "0")}`,
      email: i % 3 === 2 ? `buyer${i % people.length}@example.com` : null,
      items: i % 6 === 5 ? [] : [items[i % items.length], items[(i + 3) % items.length]].slice(0, 1 + (i % 2))
        .map(([product_name_snapshot, , quantity]) => ({ product_name_snapshot, quantity, unit: "pcs" })),
    };
  });
}
