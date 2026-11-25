import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { ownerContext } from "@/lib/server/dashboard";
import { demoLeads } from "@/lib/admin/demo";
import { signOut } from "../actions";

// Every owner page sits behind this shell. The owner check here protects the whole group;
// each page and action repeats it, so a layout change can never expose data on its own.
export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="ad-loading">Loading dashboard…</div>}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children }: { children: React.ReactNode }) {
  const ctx = await ownerContext();
  const waiting = ctx.demo
    ? demoLeads().filter((l) => l.status === "new").length
    : ((await ctx.db.from("leads").select("id", { count: "exact", head: true }).eq("status", "new")).count ?? 0);
  return (
    <AdminShell waiting={waiting} signOut={signOut} demo={ctx.demo} role={ctx.role}
      email={ctx.demo ? "owner@example.com" : (ctx.user.email ?? "Signed in")}>
      {children}
    </AdminShell>
  );
}
