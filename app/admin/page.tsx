import Link from "next/link";
import { Suspense } from "react";
import { requireOwner } from "@/lib/server/owner";
import { signOut } from "./actions";
import { RetryForm } from "@/components/admin/forms";
export default function Admin(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense
      fallback={<div className="loading-shell">Loading owner dashboard…</div>}
    >
      <Dashboard {...props} />
    </Suspense>
  );
}
async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { db } = await requireOwner();
  const params = await searchParams;
  const status =
    typeof params.status === "string" &&
    ["new", "contacted", "quoted", "won", "lost"].includes(params.status)
      ? params.status
      : "all";
  const page = Math.max(1, Math.min(10000, Number(params.page) || 1));
  let query = db
    .from("leads")
    .select(
      "id,reference,name,company,kind,status,created_at,preferred_contact",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * 25, page * 25 - 1);
  if (status !== "all") query = query.eq("status", status);
  const { data: leads, count, error } = await query;
  if (error) throw new Error("Could not load enquiries");
  const { data: failed } = await db
    .from("email_outbox")
    .select("id,kind,attempts,lead_id,created_at")
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(10);
  return (
    <>
      <div className="section-heading">
        <div>
          <span className="eyebrow">OWNER / SALES ENQUIRIES</span>
          <h1 className="admin-title" style={{ marginTop: 17 }}>
            Your conversations.
          </h1>
        </div>
        <div className="result-actions">
          <a
            className="button button-small button-outline"
            href="/admin/export"
          >
            Export enquiries CSV
          </a>
          <form action={signOut}>
            <button className="button button-small button-outline">
              Sign out
            </button>
          </form>
        </div>
      </div>
      <nav className="filter-row" aria-label="Filter enquiries">
        {["all", "new", "contacted", "quoted", "won", "lost"].map((s) => (
          <Link
            className="button button-small button-outline"
            aria-current={status === s ? "page" : undefined}
            key={s}
            href={`/admin?status=${s}`}
          >
            {s[0].toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </nav>
      <p className="spec-note">
        {count ?? 0} enquiries · Page {page}. Customer information is private.
      </p>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {[
                "Reference",
                "Contact",
                "Type",
                "Reply by",
                "Status",
                "Received",
              ].map((t) => (
                <th key={t}>{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads?.map((lead) => (
              <tr key={lead.id}>
                <td>
                  <Link href={`/admin/leads/${lead.id}`}>{lead.reference}</Link>
                </td>
                <td>
                  {lead.name}
                  <br />
                  <span>{lead.company}</span>
                </td>
                <td>{lead.kind}</td>
                <td>{lead.preferred_contact}</td>
                <td>{lead.status}</td>
                <td>
                  {new Date(lead.created_at).toLocaleDateString("en-GB", {
                    timeZone: "Asia/Karachi",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!leads?.length && (
        <div className="empty-state">
          <h2>No enquiries in this view.</h2>
          <p>
            Saved website requests will appear here, even if email delivery is
            delayed.
          </p>
        </div>
      )}
      <div className="result-actions" style={{ marginTop: 25 }}>
        {page > 1 && (
          <Link
            className="text-link"
            href={`/admin?status=${status}&page=${page - 1}`}
          >
            ← Previous
          </Link>
        )}
        {page * 25 < (count ?? 0) && (
          <Link
            className="text-link"
            href={`/admin?status=${status}&page=${page + 1}`}
          >
            Next →
          </Link>
        )}
      </div>
      {!!failed?.length && (
        <section className="admin-card" style={{ marginTop: 45 }}>
          <h2>Email delivery needs attention</h2>
          <p>
            The enquiries are saved. Fix the sending problem before retrying
            failed notifications.
          </p>
          {failed.map((job) => (
            <div
              key={job.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 20,
              }}
            >
              <Link href={`/admin/leads/${job.lead_id}`} className="text-link">
                {job.kind} notification · {job.attempts} attempts
              </Link>
              <RetryForm id={job.id} />
            </div>
          ))}
        </section>
      )}
    </>
  );
}
