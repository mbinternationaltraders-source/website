"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, FileText, Phone, Mail } from "lucide-react";
import { site, whatsappLink } from "@/lib/site";
import { useBasket } from "@/lib/basket";
import { testimonials } from "@/lib/proof";
import { CookieSettings } from "./preferences";
import { useProductInquiry } from "./product-inquiry";
import { Letters, Rise } from "./motion";

const nav: [string, string][] = [
  ["/products", "Products"],
  ["/industries", "Industries"],
  ["/about", "About"],
  ...(testimonials.length ? [["/testimonials", "Testimonials"] as [string, string]] : []),
  ["/contact", "Contact"],
];

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="MB International Traders home">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      </span>
      <span className="brand-word">MB</span>
      <span className="brand-name">
        International
        <br />
        Traders
      </span>
    </Link>
  );
}

export function Header() {
  const { items } = useBasket();
  const path = usePathname();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const open = menuPath === path;
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => e.key === "Escape" && setMenuPath(null);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);
  return (
    <header className="site-header" data-scrolled={scrolled || undefined}>
      <div className="header-inner">
        <Brand />
        <nav className="nav-pill" aria-label="Main navigation">
          {nav.map(([href, text]) => (
            <Link key={href} href={href} aria-current={path.startsWith(href) ? "page" : undefined}>
              {text}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link className="quote-link" href="/quote" aria-label={`Quote list, ${items.length} items`}>
            <FileText size={17} aria-hidden="true" />
            <span className="quote-link-text">Quote list</span>
            <span className="quote-count">{items.length}</span>
          </Link>
          <Link className="button header-cta" href="/quote">
            Request a quote
          </Link>
          <button
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setMenuPath(open ? null : path)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" className="mobile-nav" aria-label="Mobile navigation">
          {nav.map(([href, text]) => (
            <Link key={href} href={href} onClick={() => setMenuPath(null)}>
              {text}
            </Link>
          ))}
          <Link className="button" href="/quote" onClick={() => setMenuPath(null)}>
            Request a quote
          </Link>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="talk">
          <div className="talk-intro">
            <Letters as="p" className="talk-title" text="Let’s talk" />
            <p className="talk-lede">
              <strong>Have a part in mind?</strong> Send a part number, a photo or a bulk requirement
              and we’ll confirm the fit.
            </p>
            <ul className="talk-points">
              <li>
                <strong>Price by quotation.</strong>
                <span>Minimum order, availability and delivery are confirmed for your quantity.</span>
              </li>
              <li>
                <strong>Nothing ordered until you agree.</strong>
                <span>A request starts a conversation with our team, not a purchase.</span>
              </li>
            </ul>
          </div>
          <Rise className="talk-card">
            <h2>
              Start a quote <span>or reach us directly</span>
            </h2>
            <Link className="pill pill-dark talk-primary" href="/quote">
              Request a quote
            </Link>
            <a className="talk-row" href={whatsappLink("Hello, I need help identifying a component.")} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon />
              <span><small>WhatsApp</small>Send a photo of the part</span>
            </a>
            <a className="talk-row" href={`tel:${site.phoneE164}`}>
              <Phone size={18} aria-hidden="true" />
              <span><small>Phone</small>{site.phoneDisplay}</span>
            </a>
            <a className="talk-row" href={`mailto:${site.email}`}>
              <Mail size={18} aria-hidden="true" />
              <span><small>Email</small>{site.email}</span>
            </a>
            <p className="talk-note">{site.hours}</p>
          </Rise>
        </div>
        <nav className="footer-links" aria-label="Explore">
          {nav.map(([href, text]) => (
            <Link key={href} href={href}>{text} <span aria-hidden="true">↗</span></Link>
          ))}
          <Link href="/quote">Quote list <span aria-hidden="true">↗</span></Link>
          <a href={site.directions} target="_blank" rel="noopener noreferrer">Directions <span aria-hidden="true">↗</span></a>
          <a href={site.facebook} target="_blank" rel="noopener noreferrer">Facebook <span aria-hidden="true">↗</span></a>
        </nav>
        <div className="footer-bottom">
          <span>© 2026 MB International Traders · C3M · {site.address.city}</span>
          <nav aria-label="Legal">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/cookies">Cookies</Link>
            <Link href="/accessibility">Accessibility</Link>
            <CookieSettings />
          </nav>
        </div>
      </div>
    </footer>
  );
}

export function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="wa-icon">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.2h.01c5.46 0 9.91-4.45 9.91-9.91A9.9 9.9 0 0 0 12.04 2Zm5.8 14.06c-.24.68-1.42 1.3-1.95 1.35-.5.05-.97.24-3.27-.68-2.77-1.09-4.52-3.92-4.66-4.1-.13-.18-1.1-1.47-1.1-2.8 0-1.33.7-1.99.95-2.26.25-.27.54-.34.72-.34h.52c.17 0 .4-.06.62.47.24.56.8 1.94.87 2.08.07.14.12.3.02.48-.09.18-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.29-.12.56.16.27.71 1.17 1.52 1.9 1.05.93 1.93 1.22 2.2 1.36.27.14.43.12.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.23.61-.14.25.09 1.59.75 1.86.89.27.14.45.2.52.32.07.11.07.66-.17 1.33Z" />
    </svg>
  );
}

// Spec §9: a plain link that opens WhatsApp immediately; the message stays a draft for the buyer.
export function BearingContact() {
  const { product } = useProductInquiry();
  const draft = product
    ? `Hello MB International Traders, I would like a quotation for ${product.name} (SKU ${product.sku}).`
    : undefined;
  return (
    <a
      className="contact-button"
      href={whatsappLink(draft)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact MB International Traders on WhatsApp"
    >
      <WhatsAppIcon />
      <span className="contact-button-label">Contact now</span>
    </a>
  );
}
