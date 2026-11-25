export const metadata = {
  title: "Owner dashboard",
  robots: { index: false, follow: false },
};

// Owner pages get their sidebar from (owner)/layout.tsx; the sign-in page stays bare.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <main className="ad-root">{children}</main>;
}
