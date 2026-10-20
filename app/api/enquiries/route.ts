import { submissionSchema } from "@/lib/quote-schema";
import { serviceClient } from "@/lib/supabase/service";
import { verifyTurnstile } from "@/lib/server/turnstile";
import { allow } from "@/lib/server/rate-limit";
import { readBoundedJson, noStore } from "@/lib/server/request";
export async function POST(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.NODE_ENV === "production" && !configured)
    return noStore(
      {
        error:
          "Online enquiries are temporarily unavailable. Please contact our team directly.",
      },
      503,
    );
  const expected = new URL(configured || request.url);
  const origin = request.headers.get("origin");
  // Next's local request URL can use localhost when the browser uses 127.0.0.1.
  // Production continues to require the exact configured canonical origin.
  const loopbackOrigins = ["localhost", "127.0.0.1"].map(
    (host) => `http://${host}${expected.port ? `:${expected.port}` : ""}`,
  );
  const localPreview =
    process.env.NODE_ENV !== "production" &&
    !!origin &&
    loopbackOrigins.includes(origin);
  if (origin !== expected.origin && !localPreview)
    return noStore(
      { error: "Please send this request from our website." },
      403,
    );
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return noStore({ error: "Use a JSON request." }, 415);
  let raw: unknown;
  try {
    raw = await readBoundedJson(request);
  } catch (e) {
    return noStore(
      {
        error:
          e instanceof Error && e.message === "BODY_TOO_LARGE"
            ? "Your request is too large."
            : "We couldn’t read this request.",
      },
      e instanceof Error && e.message === "BODY_TOO_LARGE" ? 413 : 400,
    );
  }
  if (
    typeof raw === "object" &&
    raw !== null &&
    "website" in raw &&
    (raw as { website: unknown }).website
  )
    return noStore({ error: "Unable to accept this request." }, 400);
  const parsed = submissionSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      if (issue.path[0] === "fields") {
        const key = String(issue.path[1]);
        (fieldErrors[key] ??= []).push(issue.message);
      }
    }
    return noStore(
      { error: "Check the required details and try again.", fieldErrors },
      400,
    );
  }
  if (!process.env.SUPABASE_SECRET_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL)
    return noStore(
      {
        error:
          "Online enquiries are temporarily unavailable. Please contact our team on WhatsApp or by phone.",
      },
      503,
    );
  const { fields, items, kind, idempotencyKey, turnstileToken } = parsed.data;
  // Only trust provider-written forwarding headers on Vercel. Other deployments need a trusted edge rule.
  const ip = process.env.VERCEL
    ? (request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() ??
      null)
    : process.env.NODE_ENV !== "production"
      ? "local-preview"
      : null;
  if (!ip)
    return noStore(
      {
        error:
          "Online enquiries are temporarily unavailable. Please contact our team directly.",
      },
      503,
    );
  try {
    if (
      !(await allow("ip", ip, 5, 600)) ||
      !(await allow("global", "enquiries", 100, 3600))
    )
      return noStore(
        {
          error: "Too many requests. Please wait a few minutes and try again.",
        },
        429,
        { "Retry-After": "600" },
      );
    const verification = await verifyTurnstile(
      turnstileToken,
      ip,
      kind,
      expected.hostname,
    );
    if (!verification.ok)
      return noStore(
        {
          error:
            "The security check expired or could not be verified. Please try again.",
        },
        verification.reason === "unavailable" ||
          verification.reason === "not-configured"
          ? 503
          : 400,
      );
    const contact =
      fields.preferredContact === "email"
        ? fields.email!
        : fields.phone!.replace(/\D/g, "");
    if (!(await allow("contact", contact, 5, 3600)))
      return noStore(
        {
          error:
            "Several requests have already been received. Please wait or contact our team directly.",
        },
        429,
        { "Retry-After": "3600" },
      );
    const { data, error } = await serviceClient().rpc("create_lead", {
      p: {
        idempotency_key: idempotencyKey,
        kind,
        name: fields.name,
        company: fields.company,
        phone: fields.phone,
        email: fields.email,
        preferred_contact: fields.preferredContact,
        industry: fields.industry,
        delivery_city: fields.deliveryCity,
        message: fields.message,
        items,
      },
    });
    if (error) {
      if (error.code === "22023")
        return noStore(
          {
            error:
              "One of the items or quantities has changed. Review your quote and try again.",
          },
          409,
        );
      throw error;
    }
    const result = data?.[0];
    if (!result?.reference) throw new Error("No saved reference");
    return noStore(
      { reference: result.reference, created: result.created },
      result.created ? 201 : 200,
    );
  } catch {
    console.error("enquiry_save_failed");
    return noStore(
      {
        error:
          "We couldn’t confirm your request. Please try again or contact our team directly.",
      },
      503,
    );
  }
}
