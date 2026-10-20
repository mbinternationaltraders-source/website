import { Suspense } from "react";
import { Header, Footer } from "@/components/site-shell";
import { MissingPage } from "@/components/missing-page";
export default function NotFound() {
  return (
    <>
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      <main id="main" tabIndex={-1}>
        <MissingPage />
      </main>
      <Footer />
    </>
  );
}
