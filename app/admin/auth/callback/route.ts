import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { sessionClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/supabase/public";

// Email links (password reset, staff invite) land here. PKCE links carry ?code=, template links
// carry ?token_hash=&type=. Only fixed admin destinations are allowed, so this is not an open redirect.
const ALLOWED_NEXT = new Set(["/admin/reset", "/admin"]);
const OTP_TYPES = new Set<EmailOtpType>(["recovery", "invite", "magiclink", "email", "signup"]);

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = ALLOWED_NEXT.has(url.searchParams.get("next") ?? "") ? url.searchParams.get("next")! : "/admin/reset";
  const fail = new URL("/admin/login?link=expired", url.origin);
  if (!hasSupabase) return NextResponse.redirect(fail);
  const db = await sessionClient();
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const { error } = code
    ? await db.auth.exchangeCodeForSession(code)
    : tokenHash && type && OTP_TYPES.has(type)
      ? await db.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("missing token") };
  const res = NextResponse.redirect(error ? fail : new URL(next, url.origin));
  res.headers.set("Cache-Control", "no-store");
  return res;
}
