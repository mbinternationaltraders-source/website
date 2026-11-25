"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { X } from "lucide-react";
import { bulkStatus } from "@/app/admin/actions";
import { STATUSES, ageLabel, type LeadRow, type LeadStatus } from "@/lib/admin/stats";
import { StatusPill } from "./status-pill";

const reply: Record<string, string> = { whatsapp: "WhatsApp", phone: "Phone", email: "Email" };

export function LeadsTable({ rows, demo, canExport }: { rows: LeadRow[]; demo: boolean; canExport: boolean }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const all = useRef<HTMLInputElement>(null);
  const ids = rows.map((r) => r.id);
  const picked = selected.filter((id) => ids.includes(id)); // drops ids from a previous page or filter
  const allPicked = picked.length > 0 && picked.length === ids.length;

  useEffect(() => {
    if (all.current) all.current.indeterminate = picked.length > 0 && !allPicked;
  }, [picked.length, allPicked]);

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const apply = (status: LeadStatus) =>
    start(async () => {
      const r = await bulkStatus(picked, status);
      setMessage(r.error ?? r.success ?? "");
      if (r.success) setSelected([]);
    });

  if (!rows.length) return <div className="ad-card ad-empty">No enquiries match this view.</div>;

  return (
    <>
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th scope="col" className="ad-check">
                <input ref={all} type="checkbox" aria-label="Select all on this page" checked={allPicked}
                  onChange={() => setSelected(allPicked ? [] : ids)} />
              </th>
              <th scope="col">Contact</th>
              <th scope="col">Reference</th>
              <th scope="col">Requested</th>
              <th scope="col">Reply by</th>
              <th scope="col">Status</th>
              <th scope="col">Received</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => {
              const on = picked.includes(l.id);
              return (
                <tr key={l.id} data-selected={on || undefined}>
                  <td className="ad-check">
                    <input type="checkbox" checked={on} onChange={() => toggle(l.id)} aria-label={`Select ${l.reference}`} />
                  </td>
                  <td>
                    <Link href={`/admin/leads/${l.id}`} className="ad-row-link">{l.name}</Link>
                    <small>{l.company ?? "Individual"}{l.delivery_city ? ` · ${l.delivery_city}` : ""}</small>
                  </td>
                  <td className="ad-mono">{l.reference}</td>
                  <td>
                    {l.items.length
                      ? l.items.map((i) => `${i.product_name_snapshot} × ${i.quantity.toLocaleString("en")}`).join(", ")
                      : <span className="ad-muted">General enquiry</span>}
                  </td>
                  <td>{reply[l.preferred_contact] ?? l.preferred_contact}</td>
                  <td><StatusPill status={l.status} /></td>
                  <td><time dateTime={l.created_at} title={new Date(l.created_at).toLocaleString("en-GB", { timeZone: "Asia/Karachi" })}>{ageLabel(l.created_at)}</time></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {picked.length > 0 && (
        <div className="ad-bulk" role="region" aria-label="Bulk actions">
          <span><strong>{picked.length}</strong> selected</span>
          <label>
            <span className="sr-only">Set status</span>
            <select disabled={pending} defaultValue="" onChange={(e) => { const v = e.target.value; e.target.value = ""; if (v) apply(v as LeadStatus); }}>
              <option value="" disabled>Set status…</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
          </label>
          {canExport && <a className="ad-btn" href={`/admin/export?ids=${picked.join(",")}`} aria-disabled={demo || undefined}>Export selected</a>}
          <button type="button" className="ad-icon-btn" onClick={() => setSelected([])} aria-label="Clear selection"><X size={16} /></button>
        </div>
      )}
      <p className="ad-toast" role="status" aria-live="polite">{message}</p>
    </>
  );
}
