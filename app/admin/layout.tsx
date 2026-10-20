import Link from "next/link";
import { Brand } from "@/components/site-shell";
export const metadata = {
  title: "Owner dashboard",
  robots: { index: false, follow: false },
};
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="admin-shell">
      <header className="admin-header">
        <Brand />
        <nav className="admin-nav" aria-label="Owner navigation">
          <Link href="/admin">Enquiries</Link>
          <Link href="/admin/products">Products</Link>
          <Link href="/">View website</Link>
        </nav>
      </header>
      {children}
    </main>
  );
}
