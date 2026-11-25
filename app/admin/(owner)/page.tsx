import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight, Banknote, BellRing, Clock, Inbox, Trophy, TriangleAlert, Wallet } from "lucide-react";
import { ownerContext, loadStatsRows, loadFailedEmails } from "@/lib/server/dashboard";
import { leadStats, ageLabel, hoursLabel, isOverdue, followUps, pkr, sourceLabel, REPLY_TARGET_HOURS, type LeadRow } from "@/lib/admin/stats";
import { RetryForm } from "@/components/admin/forms";
import { StatusPill } from "@/components/admin/status-pill";

export default function Overview(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<div className="ad-loading">Loading overview…</div>}>
      <OverviewData {...props} />
    </Suspense>
  );
}

const replyLabel: Record<string, string> = { whatsapp: "WhatsApp", phone: "Phone", email: "Email" };

async function OverviewData({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ownerOnly = (await searchParams).owner === "1"; // staff sent here from an owner-only page
  const ctx = await ownerContext();
  const [rows, failed] = await Promise.all([loadStatsRows(ctx), loadFailedEmails(ctx)]);
  const s = leadStats(rows);
  const attention = rows
    .filter((r) => r.status === "new")
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(0, 6);
  const peak = Math.max(1, ...s.daily.map((d) => d.count));
  const pipeTotal = Math.max(1, s.pipeline.reduce((n, p) => n + p.count, 0));
  const topMax = Math.max(1, ...s.topProducts.map((p) => p.leads));
  const reminders = followUps(rows).slice(0, 6);
  const due = reminders.filter((r) => r.due).length;
  const srcMax = Math.max(1, ...s.sources.map((x) => x.leads));

  return (
    <div className="ad-page">
      <header className="ad-head">
        <div>
          <h1>Overview</h1>
          <p>Website enquiries and how quickly they are answered.</p>
        </div>
        <div className="ad-head-actions">
          {ctx.role === "owner" && <a className="ad-btn" href="/admin/export">Export CSV</a>}
          <Link className="ad-btn ad-btn-dark" href="/admin/leads">View enquiries</Link>
        </div>
      </header>
      {ownerOnly && <p className="ad-msg" data-tone="down" role="status">That page is for the business owner. Ask the owner if you need access.</p>}

      <section className="ad-kpis ad-kpis-6" aria-label="Key figures">
        <Kpi accent="blue" icon={<Inbox size={16} />} label="Enquiries, last 30 days" value={String(s.received)}
          chip={s.receivedChange === null ? undefined : `${s.receivedChange >= 0 ? "↑" : "↓"} ${Math.abs(s.receivedChange)}%`}
          tone={s.receivedChange === null ? undefined : s.receivedChange >= 0 ? "up" : "down"} note="vs previous 30 days" />
        <Kpi accent="amber" icon={<TriangleAlert size={16} />} label="Waiting for a reply" value={String(s.waiting)}
          chip={s.overdue ? `${s.overdue} over ${REPLY_TARGET_HOURS} h` : "none overdue"} tone={s.overdue ? "down" : "up"} note="status New" />
        <Kpi accent="violet" icon={<Clock size={16} />} label="Median first reply" value={hoursLabel(s.medianReplyHours)}
          chip={s.medianReplyHours === null ? undefined : s.medianReplyHours <= 1 ? "within 1 h" : s.medianReplyHours <= REPLY_TARGET_HOURS ? "within a day" : "slow"}
          tone={s.medianReplyHours === null ? undefined : s.medianReplyHours <= REPLY_TARGET_HOURS ? "up" : "down"} note="last 30 days" />
        <Kpi accent="green" icon={<Trophy size={16} />} label="Win rate" value={s.winRate === null ? "—" : `${s.winRate}%`}
          note="won ÷ (won + lost), 90 days" />
        <Kpi accent="blue" icon={<Wallet size={16} />} label="Open pipeline" value={pkr(s.pipelineValue)}
          note="contacted + quoted, with a value" />
        <Kpi accent="green" icon={<Banknote size={16} />} label="Won value" value={pkr(s.wonValue)}
          note="won deals, 90 days" />
      </section>

      <div className="ad-grid">
        <section className="ad-card" aria-labelledby="attention-title">
          <div className="ad-card-head">
            <h2 id="attention-title">Needs a reply</h2>
            <Link href="/admin/leads?status=new" className="ad-link">All new <ArrowUpRight size={14} /></Link>
          </div>
          {attention.length ? (
            <ul className="ad-attention">
              {attention.map((l) => (
                <li key={l.id}>
                  <Link href={`/admin/leads/${l.id}`}>
                    <span className="ad-attn-main">
                      <strong>{l.name}</strong>
                      <small>{l.company ?? "Individual"} · {summary(l)}</small>
                    </span>
                    <span className="ad-attn-meta">
                      <span data-late={isOverdue(l.created_at) || undefined}>{ageLabel(l.created_at)}</span>
                      <small>via {replyLabel[l.preferred_contact] ?? l.preferred_contact}</small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="ad-empty">Every enquiry has been answered.</p>
          )}
        </section>

        <section className="ad-card" aria-labelledby="trend-title">
          <div className="ad-card-head">
            <h2 id="trend-title">Enquiries, last 14 days</h2>
            <span className="ad-muted">{s.daily.reduce((n, d) => n + d.count, 0)} total</span>
          </div>
          <ol className="ad-bars" aria-label="Enquiries per day">
            {s.daily.map((d) => (
              <li key={d.date} title={`${d.date}: ${d.count}`}>
                <span style={{ height: `${(d.count / peak) * 100}%` }} />
                <small aria-hidden="true">{new Date(d.date).getUTCDate()}</small>
                <span className="sr-only">{d.date}: {d.count} enquiries</span>
              </li>
            ))}
          </ol>
          <h3 className="ad-sub">Pipeline, last 90 days</h3>
          <div className="ad-pipe" role="img" aria-label={s.pipeline.map((p) => `${p.status} ${p.count}`).join(", ")}>
            {s.pipeline.map((p) => p.count > 0 && <span key={p.status} data-status={p.status} style={{ flexGrow: p.count / pipeTotal }} />)}
          </div>
          <ul className="ad-legend">
            {s.pipeline.map((p) => (
              <li key={p.status}><StatusPill status={p.status} /> {p.count}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="ad-grid">
        <section className="ad-card" aria-labelledby="fu-title">
          <div className="ad-card-head">
            <h2 id="fu-title"><BellRing size={15} aria-hidden="true" /> Follow-ups</h2>
            <span className="ad-chip" data-tone={due ? "down" : "up"}>{due ? `${due} due` : "none due"}</span>
          </div>
          {reminders.length ? (
            <ul className="ad-attention">
              {reminders.map(({ lead: l, due: late }) => (
                <li key={l.id}>
                  <Link href={`/admin/leads/${l.id}`}>
                    <span className="ad-attn-main">
                      <strong>{l.name}</strong>
                      <small>{l.company ?? "Individual"} · {l.deal_value ? pkr(l.deal_value) : "no value set"}</small>
                    </span>
                    <span className="ad-attn-meta">
                      <span data-late={late || undefined}>{new Date(l.follow_up_at!).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Karachi" })}</span>
                      <small>{late ? "due" : "upcoming"}</small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="ad-empty">No reminders set. Add one on any enquiry.</p>}
        </section>
        <section className="ad-card" aria-labelledby="src-title">
          <div className="ad-card-head">
            <h2 id="src-title">Lead sources</h2>
            <span className="ad-muted">enquiries and wins, 90 days</span>
          </div>
          {s.sources.length ? (
            <ul className="ad-top ad-top-wide">
              {s.sources.map((x) => (
                <li key={x.source}>
                  <span>{sourceLabel[x.source]}</span>
                  <span className="ad-top-bar ad-bar-blue"><span style={{ width: `${(x.leads / srcMax) * 100}%` }} /></span>
                  <strong title={`${x.won} won`}>{x.leads}<small className="ad-won"> · {x.won} won</small></strong>
                </li>
              ))}
            </ul>
          ) : <p className="ad-empty">No enquiries in the last 90 days.</p>}
        </section>
      </div>

      <section className="ad-card" aria-labelledby="top-title">
        <div className="ad-card-head">
          <h2 id="top-title">Most requested products</h2>
          <span className="ad-muted">enquiries mentioning each product, 90 days</span>
        </div>
        {s.topProducts.length ? (
          <ul className="ad-top">
            {s.topProducts.map((p) => (
              <li key={p.name}>
                <span>{p.name}</span>
                <span className="ad-top-bar"><span style={{ width: `${(p.leads / topMax) * 100}%` }} /></span>
                <strong>{p.leads}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ad-empty">No product requests yet.</p>
        )}
      </section>

      {failed.length > 0 && (
        <section className="ad-card ad-card-warn" aria-labelledby="mail-title">
          <h2 id="mail-title">Email delivery needs attention</h2>
          <p className="ad-muted">These enquiries are saved. Fix the sending problem, then retry.</p>
          {failed.map((job) => (
            <div key={job.id} className="ad-failed">
              <Link href={`/admin/leads/${job.lead_id}`} className="ad-link">{job.kind} notification · {job.attempts} attempts</Link>
              <RetryForm id={job.id} />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function summary(l: LeadRow) {
  if (!l.items.length) return "General enquiry";
  const [first, ...rest] = l.items;
  return `${first.product_name_snapshot}${rest.length ? ` +${rest.length} more` : ""}`;
}

function Kpi({ icon, label, value, chip, tone, note, accent }: {
  icon: React.ReactNode; label: string; value: string; chip?: string; tone?: "up" | "down"; note: string; accent: string;
}) {
  return (
    <div className="ad-kpi" data-accent={accent}>
      <p className="ad-kpi-label"><span className="ad-kpi-icon" aria-hidden="true">{icon}</span>{label}</p>
      <p className="ad-kpi-value">{value}</p>
      <p className="ad-kpi-note">
        {chip && <span className="ad-chip" data-tone={tone}>{chip}</span>}
        <span>{note}</span>
      </p>
    </div>
  );
}
