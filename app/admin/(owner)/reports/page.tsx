import Link from "next/link";
import { Suspense } from "react";
import { ownerContext, loadAllRows } from "@/lib/server/dashboard";
import { hoursLabel, monthReport, pkr, sourceLabel } from "@/lib/admin/stats";
import { StatusPill } from "@/components/admin/status-pill";
import { PrintButton } from "@/components/admin/print-button";

export default function Reports(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<div className="ad-loading">Loading report…</div>}>
      <ReportData {...props} />
    </Suspense>
  );
}

const label = (ym: string) => new Date(`${ym}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const shift = (ym: string, by: number) => {
  const d = new Date(`${ym}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + by);
  return d.toISOString().slice(0, 7);
};

async function ReportData({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await ownerContext();
  const asked = (await searchParams).month;
  const current = new Date().toISOString().slice(0, 7);
  const ym = typeof asked === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(asked) && asked <= current ? asked : current;
  const r = monthReport(await loadAllRows(ctx), ym);
  return (
    <div className="ad-page ad-report">
      <header className="ad-head">
        <div>
          <h1>Monthly report · {label(ym)}</h1>
          <p>MB International Traders · enquiries received this month and what became of them.</p>
        </div>
        <div className="ad-head-actions ad-no-print">
          <Link className="ad-btn" href={`/admin/reports?month=${shift(ym, -1)}`}>‹ {label(shift(ym, -1))}</Link>
          {ym < current && <Link className="ad-btn" href={`/admin/reports?month=${shift(ym, 1)}`}>{label(shift(ym, 1))} ›</Link>}
          <PrintButton />
        </div>
      </header>
      <section className="ad-kpis ad-kpis-5" aria-label="Month figures">
        {[["Enquiries", String(r.enquiries)], ["Quote requests", String(r.quotes)], ["Won", String(r.won)], ["Won value", pkr(r.wonValue)], ["Median first reply", hoursLabel(r.medianReplyHours)]].map(([k, v]) => (
          <div className="ad-kpi" key={k}><p className="ad-kpi-label">{k}</p><p className="ad-kpi-value">{v}</p></div>
        ))}
      </section>
      <div className="ad-grid">
        <section className="ad-card">
          <h2>Where they are now</h2>
          <ul className="ad-legend ad-legend-col">{r.pipeline.map((p) => <li key={p.status}><StatusPill status={p.status} /> {p.count}</li>)}</ul>
        </section>
        <section className="ad-card">
          <h2>Sources</h2>
          {r.sources.length ? <ul className="ad-legend ad-legend-col">{r.sources.map((x) => <li key={x.source}>{sourceLabel[x.source]}: {x.leads} enquiries, {x.won} won</li>)}</ul> : <p className="ad-empty">None this month.</p>}
        </section>
      </div>
      <section className="ad-card">
        <h2>Most requested products</h2>
        {r.topProducts.length ? <ol className="ad-legend ad-legend-col">{r.topProducts.map((p) => <li key={p.name}>{p.name}: {p.leads} enquiries</li>)}</ol> : <p className="ad-empty">No product requests this month.</p>}
      </section>
    </div>
  );
}
