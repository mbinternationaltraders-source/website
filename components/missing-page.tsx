import Link from "next/link";
export function MissingPage() {
  return (
    <section className="container result-page">
      <h1>Page not found</h1>
      <p>
        This page may have moved or the link may be incorrect. The component you
        need could still be in our catalog.
      </p>
      <div className="result-actions">
        <Link className="button" href="/products">
          Browse products
        </Link>
        <Link className="button button-outline" href="/contact">
          Contact our team
        </Link>
      </div>
    </section>
  );
}
