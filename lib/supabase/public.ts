import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const hasSupabase = Boolean(supabaseUrl && supabasePublishableKey);

// Cookie-free client for public catalog reads, so catalog pages stay statically generated.
export function publicClient() {
  return createClient(supabaseUrl!, supabasePublishableKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
