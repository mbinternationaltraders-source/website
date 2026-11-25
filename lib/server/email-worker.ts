import "server-only";
import { serviceClient } from "@/lib/supabase/service";
import { allow } from "@/lib/server/rate-limit";

export const emailConfigured = () =>
  Boolean(
    process.env.RESEND_API_KEY &&
      process.env.EMAIL_FROM &&
      process.env.OWNER_EMAIL &&
      process.env.SUPABASE_SECRET_KEY,
  );

// Sends queued owner notifications and customer receipts. Called by the scheduled job and right after
// each saved lead. Leases (claim_outbox), provider idempotency keys and bounded retries make
// overlapping runs safe; the lead itself is already saved, so a failure here never loses a request.
export async function processOutbox(budgetMs: number) {
  const db = serviceClient();
  const started = Date.now();
  let claimed = 0,
    sent = 0,
    failed = 0,
    deferred = 0;
  // Drain in bounded batches until the queue is empty, the daily cap defers work, or time runs out.
  while (Date.now() - started < budgetMs) {
    const { data: jobs, error } = await db.rpc("claim_outbox", { p_batch: 5 });
    if (error) return { ok: false as const, claimed, sent, failed, deferred };
    if (!jobs?.length) break;
    claimed += jobs.length;
    const deferredBefore = deferred;
    for (const job of jobs) {
      try {
        const daily = Math.max(
          1,
          Math.min(10000, Number(process.env.EMAIL_DAILY_LIMIT) || 90),
        );
        if (!(await allow("email-daily", "provider", daily, 86400))) {
          await db
            .from("email_outbox")
            .update({
              status: "queued",
              attempts: Math.max(0, job.attempts - 1),
              next_attempt_at: new Date(Date.now() + 3600000).toISOString(),
              locked_until: null,
            })
            .eq("id", job.id);
          deferred++;
          continue;
        }
        const { data: lead, error: leadError } = await db
          .from("leads")
          .select(
            "reference,name,company,phone,email,preferred_contact,delivery_city,message,lead_items(product_name_snapshot,variant_name_snapshot,quantity,unit,note)",
          )
          .eq("id", job.lead_id)
          .single();
        if (leadError || !lead) throw new Error("lead_unavailable");
        const owner = job.kind === "owner";
        const text = owner
          ? [
              `New enquiry ${lead.reference}`,
              `Name: ${lead.name}`,
              `Company: ${lead.company ?? "—"}`,
              `Reply by: ${lead.preferred_contact}`,
              `Phone: ${lead.phone ?? "—"}`,
              `Email: ${lead.email ?? "—"}`,
              `Delivery city: ${lead.delivery_city ?? "—"}`,
              "",
              ...lead.lead_items.map(
                (i: {
                  product_name_snapshot: string;
                  variant_name_snapshot: string;
                  quantity: number;
                  unit: string;
                  note: string | null;
                }) =>
                  `${i.product_name_snapshot} / ${i.variant_name_snapshot}: ${i.quantity} ${i.unit}${i.note ? ` — ${i.note}` : ""}`,
              ),
              "",
              lead.message ?? "",
              `Open your owner dashboard: ${process.env.NEXT_PUBLIC_SITE_URL}/admin`,
            ].join("\n")
          : [
              `Hello ${lead.name},`,
              "",
              `Your request ${lead.reference} has been saved by MB International Traders. Our team will review your requirements and contact you through your selected channel.`,
              ...(lead.lead_items.length
                ? [
                    "",
                    "You asked about:",
                    ...lead.lead_items.map(
                      (i: {
                        product_name_snapshot: string;
                        variant_name_snapshot: string;
                        quantity: number;
                        unit: string;
                        note: string | null;
                      }) =>
                        `- ${i.product_name_snapshot} / ${i.variant_name_snapshot}: ${i.quantity} ${i.unit}${i.note ? ` (${i.note})` : ""}`,
                    ),
                  ]
                : []),
              "",
              "This is an enquiry receipt, not an order confirmation. Price, minimum order and delivery are confirmed in your quotation.",
              "",
              "MB International Traders",
              "+92 305 9617100",
            ].join("\n");
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
            "Idempotency-Key": `mb-email-${job.id}`,
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM,
            to: [owner ? process.env.OWNER_EMAIL : lead.email],
            subject: owner
              ? `New enquiry ${lead.reference}`
              : `We received your request ${lead.reference}`,
            text,
            ...(process.env.EMAIL_REPLY_TO
              ? { reply_to: process.env.EMAIL_REPLY_TO }
              : {}),
          }),
          signal: AbortSignal.timeout(7000),
        });
        if (!response.ok) throw new Error(`provider_${response.status}`);
        const result = await response.json();
        const { error: updateError } = await db
          .from("email_outbox")
          .update({
            status: "sent",
            provider_id: result.id,
            locked_until: null,
            last_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);
        if (updateError) throw new Error("queue_update_failed");
        sent++;
      } catch (e) {
        const message =
          e instanceof Error &&
          /^(provider_\d+|lead_unavailable|queue_update_failed)$/.test(
            e.message,
          )
            ? e.message
            : "send_unavailable";
        const terminal = job.attempts >= 5 || /^provider_4(?!29)/.test(message);
        await db
          .from("email_outbox")
          .update({
            status: terminal ? "failed" : "queued",
            next_attempt_at: new Date(
              Date.now() + Math.min(3600, 60 * 2 ** job.attempts) * 1000,
            ).toISOString(),
            locked_until: null,
            last_error: message,
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);
        failed++;
      }
    }
    // Every claimed job was pushed back by the daily cap: stop instead of re-claiming them in a loop.
    if (deferred - deferredBefore === jobs.length) break;
  }
  return { ok: true as const, claimed, sent, failed, deferred };
}
