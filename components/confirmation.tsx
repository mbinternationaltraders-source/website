"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { whatsappLink } from "@/lib/site";
import { PageLoader } from "./page-loader";
export function Confirmation() {
  const [reference, setReference] = useState<string | null>(null),
    [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const v = JSON.parse(sessionStorage.getItem("mb-confirmation") || "null");
      if (
        typeof v?.reference === "string" &&
        /^MB-\d{4}-\d+$/.test(v.reference)
      )
        // Read browser-only storage after hydration; the server must show the neutral state.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setReference(v.reference);
    } catch {}
    setReady(true);
  }, []);
  if (!ready)
    return <PageLoader />;
  return (
    <section className="container result-page">
      <h1>{reference ? "Request received" : "No request found"}</h1>
      {reference ? (
        <>
          <span className="result-reference">{reference}</span>
          <p>
            Your request has been saved. Our team will review the requirements
            and contact you through your preferred channel. Keep this reference
            for your conversation. A request does not confirm an order.
          </p>
        </>
      ) : (
        <p>
          There’s no confirmed request in this browser session. Start with the
          catalog or contact our team to discuss your requirements.
        </p>
      )}
      <div className="result-actions">
        <Link className="button" href="/products">
          Continue browsing
        </Link>
        {reference && (
          <a
            className="button button-outline"
            href={whatsappLink(
              `Hello, I’m following up on my request ${reference}.`,
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp us with this reference
          </a>
        )}
      </div>
    </section>
  );
}
