import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireOwner } from "@/lib/server/owner";
import { StatusForm, NoteForm } from "@/components/admin/forms";
export default function Page(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="loading-shell">Loading enquiry…</div>}>
      <Lead {...props} />
    </Suspense>
  );
}
async function Lead({ params }: { params: Promise<{ id: string }> }) {
  const { db } = await requireOwner();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { data: lead, error } = await db
    .from("leads")
    .select(
      "*,lead_items(*),lead_notes(id,body,created_at),email_outbox(kind,status,attempts)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Could not load enquiry");
  if (!lead) notFound();
  return (
    <>
      <Link className="text-link" href="/admin">
        ← All enquiries
      </Link>
      <h1 className="admin-title" style={{ marginTop: 25 }}>
        {lead.reference}
      </h1>
      <div className="admin-detail">
        <div>
          <section className="admin-card">
            <h2>{lead.name}</h2>
            <p>{lead.company}</p>
            <p>Preferred reply: {lead.preferred_contact}</p>
            {lead.phone && (
              <p>
                <a className="text-link" href={`tel:${lead.phone}`}>
                  {lead.phone}
                </a>
              </p>
            )}
            {lead.email && (
              <p>
                <a className="text-link" href={`mailto:${lead.email}`}>
                  {lead.email}
                </a>
              </p>
            )}
            <p>
              {[lead.industry, lead.delivery_city].filter(Boolean).join(" · ")}
            </p>
            <p>{lead.message || "No additional message."}</p>
            <p>
              Received{" "}
              {new Date(lead.created_at).toLocaleString("en-GB", {
                timeZone: "Asia/Karachi",
              })}{" "}
              PKT
            </p>
          </section>
          <section className="admin-card">
            <h2>Requested components</h2>
            {lead.lead_items.length ? (
              lead.lead_items.map(
                (item: {
                  id: string;
                  product_name_snapshot: string;
                  variant_name_snapshot: string;
                  quantity: number;
                  unit: string;
                  note: string | null;
                }) => (
                  <div
                    key={item.id}
                    style={{
                      borderBottom: "1px solid var(--line)",
                      padding: "12px 0",
                    }}
                  >
                    <strong>{item.product_name_snapshot}</strong>
                    <p>
                      {item.variant_name_snapshot} · {item.quantity} {item.unit}
                    </p>
                    {item.note && <p>{item.note}</p>}
                  </div>
                ),
              )
            ) : (
              <p>This is a general contact enquiry.</p>
            )}
          </section>
        </div>
        <div>
          <section className="admin-card">
            <h2>Manage enquiry</h2>
            <StatusForm id={lead.id} status={lead.status} />
          </section>
          <section className="admin-card">
            <h2>Internal notes</h2>
            {[...lead.lead_notes]
              .sort((a: { created_at: string }, b: { created_at: string }) =>
                b.created_at.localeCompare(a.created_at),
              )
              .map((note: { id: string; body: string; created_at: string }) => (
                <div
                  key={note.id}
                  style={{
                    borderBottom: "1px solid var(--line)",
                    padding: "10px 0",
                    marginBottom: 18,
                  }}
                >
                  <p>{note.body}</p>
                  <small className="spec-note">
                    {new Date(note.created_at).toLocaleString("en-GB", {
                      timeZone: "Asia/Karachi",
                    })}{" "}
                    PKT
                  </small>
                </div>
              ))}
            <NoteForm id={lead.id} />
          </section>
          <section className="admin-card">
            <h2>Notifications</h2>
            {lead.email_outbox.map(
              (job: { kind: string; status: string; attempts: number }) => (
                <p key={job.kind}>
                  {job.kind}: {job.status} ({job.attempts} attempts)
                </p>
              ),
            )}
          </section>
        </div>
      </div>
    </>
  );
}
