import "server-only";
import { redirect } from "next/navigation";
import { sessionClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/supabase/public";
export async function requireOwner() {
  if (!hasSupabase) redirect("/admin/login");
  const db = await sessionClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) redirect("/admin/login");
  const { data: owner, error: ownerError } = await db
    .from("owners")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (ownerError || !owner) redirect("/admin/login?denied=1");
  const { data: authorized, error: authError } = await db.rpc("is_owner");
  if (authError || authorized !== true) redirect("/admin/login?mfa=1");
  return { db, user };
}
