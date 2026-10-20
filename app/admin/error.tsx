"use client";
export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <div className="error-shell">
      <h2>Couldn’t load owner data.</h2>
      <p>
        Check your connection or sign in again. No customer data is shown until
        access is verified.
      </p>
      <div className="result-actions" style={{ marginTop: 24 }}>
        <button className="button" onClick={reset}>
          Try again
        </button>
        <a className="button button-outline" href="/admin/login">
          Sign in
        </a>
      </div>
    </div>
  );
}
