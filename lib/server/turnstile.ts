import "server-only";

// Cloudflare's published always-pass test secret, used only outside production (spec §11).
const TEST_SECRET = "1x0000000000000000000000000000000AA";

export async function verifyTurnstile(
  token: string,
  ip: string | null,
  action: string,
  expectedHost: string,
) {
  const secret =
    process.env.TURNSTILE_SECRET_KEY ??
    (process.env.NODE_ENV === "production" ? null : TEST_SECRET);
  if (
    !secret ||
    (process.env.NODE_ENV === "production" && secret === TEST_SECRET)
  )
    return { ok: false, reason: "not-configured" as const };
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
    },
  ).catch(() => null);
  if (!res?.ok) return { ok: false, reason: "unavailable" as const };
  const data = (await res.json()) as {
    success: boolean;
    hostname?: string;
    action?: string;
    "error-codes"?: string[];
  };
  if (!data.success) return { ok: false, reason: "failed" as const }; // includes expired or reused tokens
  if (
    secret !== TEST_SECRET &&
    (data.hostname !== expectedHost || data.action !== action)
  )
    return { ok: false, reason: "mismatch" as const };
  return { ok: true as const };
}
