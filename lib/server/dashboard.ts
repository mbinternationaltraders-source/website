import "server-only";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requireTeam, type Role } from "@/lib/server/owner";
import { hasSupabase } from "@/lib/supabase/public";
import { demoLeads } from "@/lib/admin/demo";
import { STATUSES, cleanSearch, type LeadRow, type LeadStatus } from "@/lib/admin/stats";

export const PAGE_SIZE = 10;
const FIELDS =
  "id,reference,name,company,kind,status,preferred_contact,delivery_city,created_at,first_response_at,deal_value,follow_up_at,source,phone,email,items:lead_items(product_name_snapshot,quantity,unit)";

// Demo data only on a developer machine with no database configured. Production always requires
// a signed-in, allowlisted team member with two-step verification (requireTeam).
export async function ownerContext() {
  await connection(); // owner data is always per request: never prerendered or cached
  if (!hasSupabase && process.env.NODE_ENV !== "production") return { demo: true as const, role: "owner" as Role };
  const { db, user, role } = await requireTeam();
  return { demo: false as const, db, user, role };
}

/** Owner-only pages (team, products, export) call this instead. */
export async function ownerOnlyContext() {
  const ctx = await ownerContext();
  if (!ctx.demo && ctx.role !== "owner") redirect("/admin?owner=1");
  return ctx;
}

/** Every enquiry (bounded) for customer and monthly views. */
export async function loadAllRows(ctx: Awaited<ReturnType<typeof ownerContext>>): Promise<LeadRow[]> {
  if (ctx.demo) return demoLeads();
  const { data, error } = await ctx.db.from("leads").select(FIELDS).order("created_at", { ascending: false }).limit(5000);
  if (error) throw new Error("Could not load enquiries");
  return data as unknown as LeadRow[];
}

export type LeadQuery = { status: LeadStatus | "all"; q: string; sort: "newest" | "oldest"; page: number };

export function parseLeadQuery(params: Record<string, string | string[] | undefined>): LeadQuery {
  const one = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : "");
  const status = STATUSES.includes(one("status") as LeadStatus) ? (one("status") as LeadStatus) : "all";
  return {
    status,
    q: cleanSearch(one("q")),
    sort: one("sort") === "oldest" ? "oldest" : "newest",
    page: Math.max(1, Math.min(10_000, Math.floor(Number(one("page"))) || 1)),
  };
}

/** Rows from the last 90 days plus everything still waiting for a first reply: input for leadStats. */
export async function loadStatsRows(ctx: Awaited<ReturnType<typeof ownerContext>>): Promise<LeadRow[]> {
  if (ctx.demo) return demoLeads();
  const since = new Date(Date.now() - 90 * 86_400_000).toISOString();
  const { data, error } = await ctx.db
    .from("leads")
    .select(FIELDS)
    .or(`created_at.gte.${since},status.eq.new`)
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) throw new Error("Could not load enquiry statistics");
  return data as unknown as LeadRow[];
}

export async function loadLeadPage(ctx: Awaited<ReturnType<typeof ownerContext>>, query: LeadQuery) {
  const from = (query.page - 1) * PAGE_SIZE;
  if (ctx.demo) {
    const needle = query.q.toLowerCase();
    const all = demoLeads()
      .filter((l) => query.status === "all" || l.status === query.status)
      .filter((l) => !needle || [l.name, l.company ?? "", l.reference].some((v) => v.toLowerCase().includes(needle)))
      .sort((a, b) => (query.sort === "oldest" ? 1 : -1) * a.created_at.localeCompare(b.created_at));
    return { rows: all.slice(from, from + PAGE_SIZE), count: all.length };
  }
  let request = ctx.db
    .from("leads")
    .select(FIELDS, { count: "exact" })
    .order("created_at", { ascending: query.sort === "oldest" })
    .range(from, from + PAGE_SIZE - 1);
  if (query.status !== "all") request = request.eq("status", query.status);
  if (query.q) request = request.or(`name.ilike.%${query.q}%,company.ilike.%${query.q}%,reference.ilike.%${query.q}%`);
  const { data, count, error } = await request;
  if (error) throw new Error("Could not load enquiries");
  return { rows: data as unknown as LeadRow[], count: count ?? 0 };
}

export async function loadFailedEmails(ctx: Awaited<ReturnType<typeof ownerContext>>) {
  if (ctx.demo) return [];
  const { data } = await ctx.db
    .from("email_outbox")
    .select("id,kind,attempts,lead_id")
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(10);
  return data ?? [];
}
