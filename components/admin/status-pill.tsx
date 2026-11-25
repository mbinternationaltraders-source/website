import type { LeadStatus } from "@/lib/admin/stats";

const label: Record<LeadStatus, string> = { new: "New", contacted: "Contacted", quoted: "Quoted", won: "Won", lost: "Lost" };

// Text plus colour, so the status never depends on colour alone.
export function StatusPill({ status }: { status: LeadStatus }) {
  return <span className="ad-pill" data-status={status}>{label[status] ?? status}</span>;
}
