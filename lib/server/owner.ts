import "server-only";
import { redirect } from "next/navigation";
import { sessionClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/supabase/public";

export type Role = "owner" | "staff";

// Signed-in team member (owner or staff) with a verified authenticator code (aal2), checked by the
// database (is_team) rather than trusting anything in the browser session.
export async function requireTeam() {
  if (!hasSupabase) redirect("/admin/login");
  const db = await sessionClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) redirect("/admin/login");
  const { data: member, error: memberError } = await db
    .from("owners")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (memberError || !member) redirect("/admin/login?denied=1");
  const { data: ok, error: rpcError } = await db.rpc("is_team");
  if (rpcError || ok !== true) redirect("/admin/login?mfa=1");
  return { db, user, role: member.role as Role };
}

// Owner-only: export, deletion, products, team management.
export async function requireOwner() {
  const ctx = await requireTeam();
  if (ctx.role !== "owner") redirect("/admin?owner=1");
  const { data: ok } = await ctx.db.rpc("is_owner");
  if (ok !== true) redirect("/admin?owner=1");
  return ctx;
}
