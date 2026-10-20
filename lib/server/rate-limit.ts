import "server-only";
import { createHmac } from "node:crypto";
import { serviceClient } from "@/lib/supabase/service";

// Keyed hash so buckets never store a raw IP or contact (spec §12). Fails closed if the salt is missing in production.
function hashKey(scope: string, value: string) {
  const salt =
    process.env.RATE_LIMIT_SALT ??
    (process.env.NODE_ENV === "production" ? null : "dev-only-salt");
  if (!salt) throw new Error("RATE_LIMIT_SALT is not set");
  return `${scope}:${createHmac("sha256", salt).update(value.toLowerCase()).digest("hex").slice(0, 32)}`;
}

export async function allow(
  scope: string,
  value: string,
  limit: number,
  windowSeconds: number,
) {
  const { data, error } = await serviceClient().rpc("rate_limit_hit", {
    p_key: hashKey(scope, value),
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw error;
  return data === true;
}
