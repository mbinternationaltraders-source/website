"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LayoutDashboard, Inbox, Package, Download, Globe, LogOut, PanelLeftClose, PanelLeftOpen, Users, FileBarChart, ShieldCheck } from "lucide-react";

const main = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboard, exact: true, ownerOnly: false },
  { href: "/admin/leads", label: "Enquiries", Icon: Inbox, ownerOnly: false },
  { href: "/admin/customers", label: "Customers", Icon: Users, ownerOnly: false },
  { href: "/admin/reports", label: "Reports", Icon: FileBarChart, ownerOnly: false },
  { href: "/admin/products", label: "Products", Icon: Package, ownerOnly: true },
  { href: "/admin/team", label: "Team", Icon: ShieldCheck, ownerOnly: true },
];

// Sidebar layout for signed-in owner pages (reference: Uxerflow dashboard). Collapsible on desktop,
// a top bar on phones. Sign-out is a server action passed in so this stays a thin client shell.
export function AdminShell({ children, waiting, signOut, demo, role, email }: {
  children: ReactNode; waiting: number; signOut: () => Promise<void>; demo: boolean; role: "owner" | "staff"; email: string;
}) {
  const path = usePathname() ?? "/admin";
  const [collapsed, setCollapsed] = useState(false);
  const active = (href: string, exact?: boolean) => (exact ? path === href : path.startsWith(href));
  return (
    <div className="ad-app" data-collapsed={collapsed || undefined}>
      <aside className="ad-side" aria-label="Owner navigation">
        <div className="ad-brand">
          <span className="ad-logo" aria-hidden="true">MB</span>
          <span className="ad-brand-text">
            <strong>MB International</strong>
            <small>Owner dashboard</small>
          </span>
          <button type="button" className="ad-icon-btn ad-collapse" onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed}>
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
        <p className="ad-group">Main menu</p>
        <nav className="ad-nav">
          {/* Owner-only links are hidden for staff; the pages also refuse staff on the server. */}
          {main.filter((m) => role === "owner" || !m.ownerOnly).map(({ href, label, Icon, exact }) => (
            <Link key={href} href={href} aria-current={active(href, exact) ? "page" : undefined} title={label}>
              <Icon size={17} aria-hidden="true" />
              <span>{label}</span>
              {href === "/admin/leads" && waiting > 0 && <em aria-label={`${waiting} waiting`}>{waiting}</em>}
            </Link>
          ))}
        </nav>
        <p className="ad-group">Tools</p>
        <nav className="ad-nav">
          {role === "owner" && <a href="/admin/export" title="Export CSV"><Download size={17} aria-hidden="true" /><span>Export CSV</span></a>}
          <Link href="/" title="View website"><Globe size={17} aria-hidden="true" /><span>View website</span></Link>
        </nav>
        <div className="ad-side-foot">
          {demo && <p className="ad-demo">Demo data. Connect Supabase to see real enquiries.</p>}
          <p className="ad-who"><span>{email}</span><small>{role === "owner" ? "Owner" : "Staff"} · two-step verified</small></p>
          <form action={signOut}>
            <button className="ad-nav-btn" title="Sign out" disabled={demo}>
              <LogOut size={17} aria-hidden="true" /><span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>
      <div className="ad-main">{children}</div>
    </div>
  );
}
