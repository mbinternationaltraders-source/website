import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { z } from "zod";
import { ownerContext } from "@/lib/server/dashboard";
import { demoLeads } from "@/lib/admin/demo";
import { ageLabel, hoursLabel, waNumber, pkr, sourceLabel, type LeadSource, type LeadStatus } from "@/lib/admin/stats";
import { StatusForm, NoteForm, DealForm } from "@/components/admin/forms";
import { StatusPill } from "@/components/admin/status-pill";

export default function Page(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="ad-loading">Loading enquiry…</div>}>
      <Lead {...props} />
    </Suspense>
  );
}

type Item = { id?: string; product_name_snapshot: string; variant_name_snapshot?: string; quantity: number; unit: string; note?: string | null };
type Detail = {
  id: string; reference: string; name: string; company: string | null; status: LeadStatus; preferred_contact: string;
  phone: string | null; email: string | null; industry: string | null; delivery_city: string | null; message: string | null;
  created_at: string; first_response_at: string | null; items: Item[];
  deal_value: number | null; follow_up_at: string | null; source: LeadSource;
  notes: { id: string; body: string; created_at: string }[]; outbox: { kind: string; status: string; attempts: number; updated_at?: string }[];
};
type Event = { at: string; text: string; tone?: string };

const actionText = (a: string) =>
  a.startsWith("lead.status.") ? `Moved to ${a.slice(12)}` : a === "lead.deal" ? "Deal details updated" : a === "lead.status" ? "Status changed" : a;

const pkt = (iso: string) => `${new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Karachi", dateStyle: "medium", timeStyle: "short" })} PKT`;

async function Lead({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await ownerContext();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  let lead: Detail | null;
  let audit: { action: string; created_at: string }[] = [];
  if (ctx.demo) {
    const d = demoLeads().find((l) => l.id === id);
    lead = d ? { ...d, industry: "cooler", message: "Need samples first.", notes: [], outbox: [] } : null;
    audit = d?.first_response_at ? [{ action: `lead.status.${d.status}`, created_at: d.first_response_at }] : [];
  } else {
    const { data, error } = await ctx.db
      .from("leads")
      .select("*,items:lead_items(*),notes:lead_notes(id,body,created_at),outbox:email_outbox(kind,status,attempts,updated_at)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error("Could not load enquiry");
    lead = data as Detail | null;
    const { data: events } = await ctx.db.from("audit_events").select("action,created_at").eq("entity", "leads").eq("entity_id", id).order("created_at");
    audit = events ?? [];
  }
  if (!lead) notFound();
  // One time-ordered history: arrival, first reply, stage and deal changes, notes, emails.
  const timeline: Event[] = [
    { at: lead.created_at, text: `Enquiry received (${lead.reference})`, tone: "new" },
    ...(lead.first_response_at ? [{ at: lead.first_response_at, text: "First reply", tone: "won" }] : []),
    ...audit.map((e) => ({ at: e.created_at, text: actionText(e.action), tone: e.action.split(".")[2] })),
    ...lead.notes.map((n) => ({ at: n.created_at, text: `Note: ${n.body.length > 80 ? `${n.body.slice(0, 80)}…` : n.body}` })),
    ...lead.outbox.filter((o) => o.status === "sent" && o.updated_at).map((o) => ({ at: o.updated_at!, text: `${o.kind === "owner" ? "Owner alert" : "Customer receipt"} emailed`, tone: "email" })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  const wa = waNumber(lead.phone);
  const waText = encodeURIComponent(`Hello ${lead.name}, this is MB International Traders about your request ${lead.reference}.`);

  return (
    <div className="ad-page">
      <Link className="ad-link ad-back" href="/admin/leads"><ArrowLeft size={14} /> All enquiries</Link>
      <header className="ad-head">
        <div>
          <h1>{lead.name} <StatusPill status={lead.status} /></h1>
          <p>{lead.reference} · {lead.company ?? "Individual"} · received {ageLabel(lead.created_at)}</p>
        </div>
        {/* One-click replies; the WhatsApp text is a draft the owner reviews before sending. */}
        <div className="ad-head-actions">
          {wa && <a className="ad-btn ad-btn-dark" href={`https://wa.me/${wa}?text=${waText}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={15} /> WhatsApp</a>}
          {lead.phone && <a className="ad-btn" href={`tel:${lead.phone}`}><Phone size={15} /> Call</a>}
          {lead.email && <a className="ad-btn" href={`mailto:${lead.email}?subject=${encodeURIComponent(`Your request ${lead.reference}`)}`}><Mail size={15} /> Email</a>}
        </div>
      </header>

      <div className="ad-grid">
        <div className="ad-stack">
          <section className="ad-card" aria-labelledby="req-title">
            <h2 id="req-title">Requested components</h2>
            {lead.items.length ? (
              <ul className="ad-items">
                {lead.items.map((item, i) => (
                  <li key={item.id ?? i}>
                    <strong>{item.product_name_snapshot}</strong>
                    <span>{item.variant_name_snapshot ? `${item.variant_name_snapshot} · ` : ""}{item.quantity.toLocaleString("en")} {item.unit}</span>
                    {item.note && <small>{item.note}</small>}
                  </li>
                ))}
              </ul>
            ) : <p className="ad-muted">General contact enquiry.</p>}
            {lead.message && <blockquote className="ad-quote">{lead.message}</blockquote>}
          </section>
          <section className="ad-card" aria-labelledby="contact-title">
            <h2 id="contact-title">Contact details</h2>
            <dl className="ad-dl">
              <dt>Prefers</dt><dd>{({ whatsapp: "WhatsApp", phone: "Phone call", email: "Email" } as Record<string, string>)[lead.preferred_contact] ?? lead.preferred_contact}</dd>
              <dt>Phone</dt><dd>{lead.phone ?? "—"}</dd>
              <dt>Email</dt><dd>{lead.email ?? "—"}</dd>
              <dt>Industry</dt><dd className="ad-cap">{lead.industry?.replace(/-/g, " ") ?? "—"}</dd>
              <dt>Delivery city</dt><dd>{lead.delivery_city ?? "—"}</dd>
              <dt>Received</dt><dd>{pkt(lead.created_at)}</dd>
              <dt>Source</dt><dd>{sourceLabel[lead.source] ?? lead.source}</dd>
              <dt>Deal value</dt><dd>{lead.deal_value ? pkr(lead.deal_value) : "—"}</dd>
              <dt>First reply</dt>
              <dd>{lead.first_response_at ? `${pkt(lead.first_response_at)} (after ${hoursLabel((Date.parse(lead.first_response_at) - Date.parse(lead.created_at)) / 3_600_000)})` : "Not yet"}</dd>
            </dl>
          </section>
        </div>
        <div className="ad-stack">
          <section className="ad-card" aria-labelledby="manage-title">
            <h2 id="manage-title">Pipeline stage</h2>
            <StatusForm id={lead.id} status={lead.status} />
          </section>
          <section className="ad-card" aria-labelledby="deal-title">
            <h2 id="deal-title">Deal</h2>
            <DealForm id={lead.id} value={lead.deal_value} followUp={lead.follow_up_at} source={lead.source} />
          </section>
          <section className="ad-card" aria-labelledby="notes-title">
            <h2 id="notes-title">Internal notes</h2>
            {[...lead.notes].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((n) => (
              <div key={n.id} className="ad-note">
                <p>{n.body}</p>
                <small>{pkt(n.created_at)}</small>
              </div>
            ))}
            <NoteForm id={lead.id} />
          </section>
          <section className="ad-card" aria-labelledby="activity-title">
            <h2 id="activity-title">Activity</h2>
            <ol className="ad-timeline">
              {timeline.map((e, i) => (
                <li key={i} data-tone={e.tone}>
                  <span>{e.text}</span>
                  <time dateTime={e.at}>{pkt(e.at)}</time>
                </li>
              ))}
            </ol>
            {lead.outbox.some((o) => o.status === "failed") && <p className="ad-msg" data-tone="down">An email failed. Retry it from the Overview.</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
