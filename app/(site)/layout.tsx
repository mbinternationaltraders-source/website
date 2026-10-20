import { Suspense, ViewTransition } from "react";
import { Header, Footer, BearingContact } from "@/components/site-shell";
import { ProductInquiryProvider } from "@/components/product-inquiry";
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProductInquiryProvider>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Suspense fallback={<div className="header-placeholder" />}>
        <Header />
      </Suspense>
      <main id="main" tabIndex={-1}>
        {/* Route changes: the new page rises over the paper like the reference's curtain. */}
        <ViewTransition update="page-rise" default="none">
          <div>{children}</div>
        </ViewTransition>
      </main>
      <Footer />
      <BearingContact />
    </ProductInquiryProvider>
  );
}
