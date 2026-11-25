import Link from "next/link";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { ownerContext, loadLeadPage, parseLeadQuery, PAGE_SIZE, type LeadQuery } from "@/lib/server/dashboard";
import { STATUSES } from "@/lib/admin/stats";
import { LeadsTable } from "@/components/admin/leads-table";

export default function Leads(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<div className="ad-loading">Loading enquiries…</div>}>
      <LeadsData {...props} />
    </Suspense>
  );
}

const href = (q: LeadQuery, patch: Partial<LeadQuery>) => {
  const next = { ...q, ...patch };
  const p = new URLSearchParams();
  if (next.status !== "all") p.set("status", next.status);
  if (next.q) p.set("q", next.q);
  if (next.sort !== "newest") p.set("sort", next.sort);
  if (next.page > 1) p.set("page", String(next.page));
  const s = p.toString();
  return `/admin/leads${s ? `?${s}` : ""}`;
};

async function LeadsData({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = parseLeadQuery(await searchParams);
  const ctx = await ownerContext();
  const { rows, count } = await loadLeadPage(ctx, query);
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const pageList = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === pages || Math.abs(n - query.page) <= 1,
  );

  return (
    <div className="ad-page">
      <header className="ad-head">
        <div>
          <h1>Enquiries</h1>
          <p>{count} {count === 1 ? "enquiry" : "enquiries"}{query.status !== "all" ? ` · ${query.status}` : ""}{query.q ? ` · “${query.q}”` : ""}</p>
        </div>
        <div className="ad-head-actions">
          {ctx.role === "owner" && <a className="ad-btn" href="/admin/export">Export all</a>}
        </div>
      </header>

      <div className="ad-toolbar">
        <form className="ad-search" role="search" action="/admin/leads">
          <Search size={16} aria-hidden="true" />
          <input name="q" defaultValue={query.q} placeholder="Search name, company or reference" aria-label="Search enquiries" maxLength={60} />
          {query.status !== "all" && <input type="hidden" name="status" value={query.status} />}
          {query.sort !== "newest" && <input type="hidden" name="sort" value={query.sort} />}
        </form>
        <nav className="ad-tabs" aria-label="Filter by status">
          {(["all", ...STATUSES] as const).map((s) => (
            <Link key={s} href={href(query, { status: s, page: 1 })} aria-current={query.status === s ? "page" : undefined}>
              {s === "all" ? "All" : s[0].toUpperCase() + s.slice(1)}
            </Link>
          ))}
        </nav>
        <Link className="ad-btn" href={href(query, { sort: query.sort === "newest" ? "oldest" : "newest", page: 1 })}>
          {query.sort === "newest" ? "Newest first" : "Oldest first"}
        </Link>
      </div>

      <LeadsTable rows={rows} demo={ctx.demo} canExport={ctx.role === "owner"} />

      <nav className="ad-pager" aria-label="Pages">
        <span className="ad-muted">Showing {rows.length ? (query.page - 1) * PAGE_SIZE + 1 : 0}–{(query.page - 1) * PAGE_SIZE + rows.length} of {count}</span>
        <div>
          {query.page > 1 && <Link href={href(query, { page: query.page - 1 })} aria-label="Previous page">‹</Link>}
          {pageList.map((n, i) => (
            <span key={n}>
              {i > 0 && n - pageList[i - 1] > 1 && <span className="ad-gap">…</span>}
              <Link href={href(query, { page: n })} aria-current={n === query.page ? "page" : undefined}>{n}</Link>
            </span>
          ))}
          {query.page < pages && <Link href={href(query, { page: query.page + 1 })} aria-label="Next page">›</Link>}
        </div>
      </nav>
    </div>
  );
}
