import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./public";

// Secret key bypasses RLS: only for quote ingestion, rate limiting and the outbox worker.
export function serviceClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !key) throw new Error("Supabase is not configured");
  return createClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
