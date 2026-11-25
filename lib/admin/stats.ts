// Pure dashboard maths: no database or React, so it is unit-tested directly.

export const STATUSES = ["new", "contacted", "quoted", "won", "lost"] as const;
export type LeadStatus = (typeof STATUSES)[number];

export type LeadRow = {
  id: string;
  reference: string;
  name: string;
  company: string | null;
  kind: "quote" | "contact";
  status: LeadStatus;
  preferred_contact: string;
  delivery_city: string | null;
  created_at: string;
  first_response_at: string | null;
  deal_value: number | null; // PKR, owner-entered
  follow_up_at: string | null;
  source: LeadSource;
  phone: string | null;
  email: string | null;
  items: { product_name_snapshot: string; quantity: number; unit: string }[];
};

export const SOURCES = ["website", "google", "whatsapp", "facebook", "referral", "repeat", "walk_in", "other"] as const;
export type LeadSource = (typeof SOURCES)[number];
export const sourceLabel: Record<LeadSource, string> = {
  website: "Website", google: "Google", whatsapp: "WhatsApp", facebook: "Facebook",
  referral: "Referral", repeat: "Repeat customer", walk_in: "Walk-in", other: "Other",
};
const open = (r: { status: LeadStatus }) => r.status !== "won" && r.status !== "lost";
const sum = (xs: (number | null)[]) => xs.reduce<number>((n, x) => n + (x ?? 0), 0);

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
// A new enquiry waiting longer than this is flagged; replies within the first hour qualify far more often.
export const REPLY_TARGET_HOURS = 24;

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export function leadStats(rows: LeadRow[], now = Date.now()) {
  const age = (r: LeadRow) => now - Date.parse(r.created_at);
  const last30 = rows.filter((r) => age(r) < 30 * DAY);
  const prev30 = rows.filter((r) => age(r) >= 30 * DAY && age(r) < 60 * DAY);
  const last90 = rows.filter((r) => age(r) < 90 * DAY);
  const waiting = rows.filter((r) => r.status === "new");
  const decided = last90.filter((r) => r.status === "won" || r.status === "lost");
  const replyHours = last30
    .filter((r) => r.first_response_at)
    .map((r) => (Date.parse(r.first_response_at!) - Date.parse(r.created_at)) / HOUR);

  const daily = Array.from({ length: 14 }, (_, i) => {
    const day = new Date(now - (13 - i) * DAY);
    const key = day.toISOString().slice(0, 10);
    return { date: key, count: rows.filter((r) => r.created_at.slice(0, 10) === key).length };
  });

  const asked = new Map<string, number>();
  for (const r of last90)
    for (const name of new Set(r.items.map((i) => i.product_name_snapshot)))
      asked.set(name, (asked.get(name) ?? 0) + 1);

  return {
    received: last30.length,
    receivedChange: prev30.length ? Math.round(((last30.length - prev30.length) / prev30.length) * 100) : null,
    waiting: waiting.length,
    overdue: waiting.filter((r) => age(r) > REPLY_TARGET_HOURS * HOUR).length,
    medianReplyHours: median(replyHours),
    winRate: decided.length ? Math.round((decided.filter((r) => r.status === "won").length / decided.length) * 100) : null,
    pipeline: STATUSES.map((s) => ({ status: s, count: last90.filter((r) => r.status === s).length })),
    daily,
    topProducts: [...asked].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, leads]) => ({ name, leads })),
    // Money: open deals with a value, and value won in the last 90 days.
    pipelineValue: sum(rows.filter((r) => r.status === "contacted" || r.status === "quoted").map((r) => r.deal_value)),
    wonValue: sum(last90.filter((r) => r.status === "won").map((r) => r.deal_value)),
    sources: SOURCES.map((src) => {
      const of = last90.filter((r) => r.source === src);
      return { source: src, leads: of.length, won: of.filter((r) => r.status === "won").length };
    }).filter((x) => x.leads > 0),
  };
}

/** Open enquiries with a reminder set, earliest first; due = reminder time has passed. */
export function followUps(rows: LeadRow[], now = Date.now()) {
  return rows
    .filter((r) => r.follow_up_at && open(r))
    .map((r) => ({ lead: r, due: Date.parse(r.follow_up_at!) <= now }))
    .sort((a, b) => a.lead.follow_up_at!.localeCompare(b.lead.follow_up_at!));
}

/** One row per customer: same phone (normalised), else same email, else same company name. */
export function groupCustomers(rows: LeadRow[]) {
  const groups = new Map<string, LeadRow[]>();
  for (const r of rows) {
    const key = waNumber(r.phone) ?? r.email?.toLowerCase() ?? (r.company ? `co:${r.company.toLowerCase().trim()}` : `id:${r.id}`);
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  return [...groups.values()]
    .map((leads) => {
      const byDate = [...leads].sort((a, b) => b.created_at.localeCompare(a.created_at));
      const won = leads.filter((l) => l.status === "won");
      return {
        latest: byDate[0], name: byDate[0].name, company: byDate.find((l) => l.company)?.company ?? null,
        enquiries: leads.length, won: won.length, wonValue: sum(won.map((l) => l.deal_value)),
        open: leads.filter(open).length, last: byDate[0].created_at,
      };
    })
    .sort((a, b) => b.enquiries - a.enquiries || b.last.localeCompare(a.last));
}

/** Figures for one calendar month (YYYY-MM, Pakistan time is close enough at month granularity). */
export function monthReport(rows: LeadRow[], ym: string) {
  const inMonth = rows.filter((r) => r.created_at.slice(0, 7) === ym);
  const end = Date.parse(`${ym}-01T00:00:00Z`) + 40 * DAY; // evaluate as if just after the month ended
  const s = leadStats(inMonth, end);
  const won = inMonth.filter((r) => r.status === "won");
  return {
    ym, enquiries: inMonth.length, quotes: inMonth.filter((r) => r.kind === "quote").length,
    won: won.length, wonValue: sum(won.map((r) => r.deal_value)),
    medianReplyHours: median(inMonth.filter((r) => r.first_response_at).map((r) => (Date.parse(r.first_response_at!) - Date.parse(r.created_at)) / HOUR)),
    pipeline: STATUSES.map((st) => ({ status: st, count: inMonth.filter((r) => r.status === st).length })),
    topProducts: s.topProducts, sources: s.sources,
  };
}

export const pkr = (n: number) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;

export function ageLabel(iso: string, now = Date.now()) {
  const mins = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

export function hoursLabel(h: number | null) {
  if (h === null) return "—";
  return h < 1 ? `${Math.max(1, Math.round(h * 60))} min` : h < 48 ? `${h.toFixed(h < 10 ? 1 : 0)} h` : `${Math.round(h / 24)} days`;
}

// Search text for the leads table. Only letters, digits and a few separators survive, so the value is
// safe to place inside a PostgREST filter string (no commas, parentheses or wildcards from the user).
export function cleanSearch(q: unknown) {
  return typeof q === "string" ? q.replace(/[^\p{L}\p{N} @.\-]/gu, "").trim().slice(0, 60) : "";
}

// wa.me needs international digits only. Pakistani numbers are often typed locally as 03xx…; others pass through.
export function waNumber(phone: string | null) {
  if (!phone) return null;
  const d = phone.replace(/\D/g, "");
  const intl = d.startsWith("00") ? d.slice(2) : d.startsWith("0") ? `92${d.slice(1)}` : d;
  return intl.length >= 8 && intl.length <= 15 ? intl : null;
}

export const isOverdue = (iso: string, now = Date.now()) => now - Date.parse(iso) > REPLY_TARGET_HOURS * HOUR;
