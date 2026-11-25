import Link from "next/link";
import { clients, initials, type Testimonial } from "@/lib/proof";
import { Rise } from "./motion";

/** "Our clients": each client's own logo on a white tile, rising in a stagger. */
export function ClientGrid() {
  return (
    <ul className="client-grid">
      {clients.map((c, i) => (
        <Rise as="li" key={c.name} delay={(i % 5) * 70 + Math.floor(i / 5) * 140} className="client-tile">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.logo} width={c.w} height={c.h} alt={c.name} loading="lazy" decoding="async" className="client-logo" />
          <small>{c.makes}</small>
        </Rise>
      ))}
    </ul>
  );
}

function Person({ t, i }: { t: Testimonial; i: number }) {
  return (
    <div className="t-person">
      <span className="t-avatar" data-tone={i % 6} aria-hidden="true">{initials(t.name)}</span>
      <div>
        <strong>{t.name}</strong>
        <small>{t.role} · {t.city}</small>
      </div>
    </div>
  );
}

function Quote({ t }: { t: Testimonial }) {
  return (
    <div className="t-quote">
      <svg viewBox="0 0 32 24" aria-hidden="true" className="t-mark">
        <path d="M0 24V14C0 6 4.5 1.3 12.5 0l1.4 3.6C9.3 5 7.2 8 7 12h6v12H0Zm18 0V14c0-8 4.5-12.7 12.5-14l1.4 3.6C27.3 5 25.2 8 25 12h6v12H18Z" />
      </svg>
      <blockquote>{t.quote}</blockquote>
    </div>
  );
}

/** Reference-style "Experiences" row: a summary card, then cards alternating person-first / quote-first. */
export function TestimonialCards({ items, summary = true }: { items: Testimonial[]; summary?: boolean }) {
  return (
    <ul className="t-grid">
      {summary && (
        <Rise as="li" className="t-card t-summary">
          <p>
            <strong>{clients.length} appliance makers in Gujranwala</strong>{" "}
            <span>source pumps, motors and heating parts from us for their production lines.</span>
          </p>
          <div>
            <span className="t-stack" aria-hidden="true">
              {clients.slice(0, 4).map((c) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={c.name} src={c.logo} width={c.w} height={c.h} alt="" loading="lazy" />
              ))}
              <span className="t-more">+{clients.length - 4}</span>
            </span>
            <Link href="/testimonials" className="t-link">
              Read testimonials <span aria-hidden="true">→</span>
            </Link>
          </div>
        </Rise>
      )}
      {items.map((t, i) => (
        <Rise as="li" key={t.name} delay={(i + 1) * 110} className={`t-card ${i % 2 ? "t-quote-first" : ""}`}>
          {t.sample && <span className="t-sample">Sample</span>}
          <Person t={t} i={i} />
          <Quote t={t} />
        </Rise>
      ))}
    </ul>
  );
}
