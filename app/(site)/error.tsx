"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="error-shell">
      <h2>We couldn’t load this page.</h2>
      <p>Your quote basket is still saved in this browser.</p>
      <div className="result-actions" style={{ marginTop: 25 }}>
        <button className="button" onClick={reset}>
          Try again
        </button>
        <Link className="button button-outline" href="/contact">
          Contact our team
        </Link>
      </div>
    </section>
  );
}
