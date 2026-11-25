import Link from "next/link";
import { getCatalog } from "@/lib/catalog/data";
import { getPhotos } from "@/lib/catalog/media";
import { HomeHero } from "@/components/home-hero";
import { PhotoImg } from "@/components/product-photo";
import { Fill, Letters, Rise } from "@/components/motion";
import { ClientGrid, TestimonialCards } from "@/components/proof";
import { testimonials } from "@/lib/proof";
import { Showreel, type ReelItem } from "@/components/showreel";
import { LoopVideo } from "@/components/loop-video";
import { getVideo } from "@/lib/catalog/videos";
import { metadataFor, jsonLd } from "@/lib/seo";
import { site, whatsappLink } from "@/lib/site";

export const metadata = metadataFor(
  "Components for manufacturers and workshops",
  "C3M motors, pumps, bearings and heating components. Explore the full collection and request a business quotation from Gujranwala, Pakistan.",
  "/",
);

const featured = ["water-cooler-pump-lh1020", "ball-bearings", "geyser-element", "washing-machine-timer"];

const steps = [
  ["Choose your parts", "Add what you need to your quote list. No account needed."],
  ["Share the details", "Quantities, ratings or a part number. A photo helps us match it."],
  ["Confirm with our team", "We reply with price, minimum order and delivery. Nothing is ordered until you agree."],
];

const faqs = [
  ["What is the minimum order quantity?", "It depends on the part. We confirm the minimum order for your quantity in the quotation, together with price and delivery."],
  ["Can you help identify a component?", "Yes. Send a photo, the part number or the dimensions on WhatsApp and we will match it to a part we supply."],
  ["How do I request several products?", "Add each product to your quote list, set the quantity and unit for each, then send one request."],
  ["Why are prices not shown?", "Price depends on quantity, variant and delivery. We quote each request so the figure matches what you actually order."],
  ["Does submitting a request place an order?", "No. A request starts a conversation. Nothing is ordered or charged until you agree the quotation with our team."],
];

export default async function Home() {
  const { products, industries } = await getCatalog();
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const reel: ReelItem[] = ["induction-cooker", "capacitors"].flatMap((slug) => {
    const p = bySlug.get(slug), v = getVideo(slug);
    return p && v ? [{ slug, name: p.name, ...v }] : [];
  });

  return (
    <>
      <div className="frame frame-under">
        <HomeHero productCount={products.length} industryCount={industries.length} />
      </div>

      <section className="container clients-band" aria-labelledby="clients-title">
        <h2 id="clients-title" className="side-label">Our clients</h2>
        <ClientGrid />
      </section>

      <section className="container section" aria-labelledby="featured-title">
        <div className="split-head">
          <span aria-hidden="true" /> {/* keeps the heading in the right-hand column */}
          <Letters as="h2" id="featured-title" className="display" text="Featured products" />
        </div>
        <div className="feature-grid">
          {featured.map((slug, i) => {
            const p = bySlug.get(slug);
            const photo = getPhotos(slug)[0];
            if (!p || !photo) return null;
            const industry = industries.find((ind) => ind.slug === p.industries[0]);
            return (
              <Rise key={slug} delay={(i % 2) * 120}>
                <Link href={`/products/${slug}`} className="feature-tile" data-accent={p.industries[0]} prefetch>
                  <span className="feature-label">
                    <strong>{p.model ? `${p.name} ${p.model}` : p.name}</strong>
                    <span>/ {industry?.name ?? p.family}</span>
                  </span>
                  <span className="feature-photo">
                    <PhotoImg photo={photo} sizes="(max-width: 768px) 92vw, 44vw" />
                  </span>
                </Link>
              </Rise>
            );
          })}
        </div>
        <Rise className="center-action">
          <Link className="pill pill-dark pill-small" href="/products">
            All {products.length} products <span className="pill-dot" aria-hidden="true" />
          </Link>
        </Rise>
      </section>

      {/* Hidden when no breakdown products are published, so catalogue edits cannot break the homepage. */}
      {reel.length > 0 && (
      <section className="container section" aria-labelledby="inside-title">
        <div className="split-head">
          <span aria-hidden="true" /> {/* keeps the heading in the right-hand column */}
          <Fill as="h2" id="inside-title" className="display-two-tone" text="A look inside," muted="showing the typical construction of parts we supply." />
        </div>
        <Rise className="reel-rise">
          <Showreel items={reel} />
        </Rise>
      </section>
      )}

      <section className="container section" aria-labelledby="why-title">
        <div className="split-head">
          <span aria-hidden="true" /> {/* keeps the heading in the right-hand column */}
          <Fill
            as="h2"
            id="why-title"
            className="display-two-tone"
            text="One list, one request,"
            muted="and a clear quotation for every part you need."
          />
        </div>
        <div className="why-grid">
          <Rise className="why-intro">
            {/* Circle loop cut from the capacitor breakdown clip: the range turning in a ring. */}
            <div className="circle-video">
              <LoopVideo sources={[{ src: "/videos/capacitor-ring-720.mp4" }]} poster="/images/videos/capacitor-ring.webp" label="Film capacitors turning in a ring" />
            </div>
            <p>
              No checkout and no account. Tell us what you build and we confirm specifications,
              quantities and delivery before anything is ordered.
            </p>
          </Rise>
          <ol className="step-cards">
            {steps.map(([title, body], i) => (
              <Rise key={title} as="li" delay={i * 110} className="step-card" data-tone={[0, 1, 2][i]}>
                <span className="step-value">0{i + 1}</span>
                <strong>{title}</strong>
                <p>{body}</p>
              </Rise>
            ))}
          </ol>
        </div>
      </section>

      <section className="dark-band" aria-labelledby="industries-title">
        <div className="container">
          <div className="split-head">
            <p className="side-label">What you make</p>
            <Letters as="h2" id="industries-title" className="display" text="Industries" />
          </div>
          <ul className="service-list">
            {industries.map((ind, i) => {
              const list = products.filter((p) => p.industries.includes(ind.slug));
              return (
                <li key={ind.slug} data-accent={ind.slug}>
                  <details open={i === 0}>
                    <summary>
                      <span className="service-index">{String(i + 1).padStart(3, "0")}</span>
                      <span className="service-name">{ind.name}</span>
                      <span className="service-toggle" aria-hidden="true" />
                    </summary>
                    <div className="service-body">
                      <p>{ind.intro}</p>
                      <div>
                        <span className="service-chips-label">Parts</span>
                        <ul className="chips">
                          {list.map((p) => (
                            <li key={p.slug}>
                              <Link href={`/products/${p.slug}`} prefetch>{p.name}</Link>
                            </li>
                          ))}
                        </ul>
                        <Link className="text-link-light" href={`/industries/${ind.slug}`} prefetch>
                          {ind.name} components →
                        </Link>
                      </div>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
          <Link className="pill pill-light pill-small" href="/quote">
            Get started
          </Link>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="container section" aria-labelledby="testimonials-title">
          <div className="split-head">
            <p className="side-label">Testimonials</p>
            <Letters as="h2" id="testimonials-title" className="display" text="Experiences" />
          </div>
          <TestimonialCards items={testimonials.slice(0, 3)} />
        </section>
      )}

      <section className="container section faq" aria-labelledby="faq-title">
        <div>
          <Letters as="h2" id="faq-title" className="faq-title" text="FAQ" />
          <p className="muted">
            Buying questions, answered. Anything else,{" "}
            <a className="text-link" href={whatsappLink("Hello, I have a question about a component.")} target="_blank" rel="noopener noreferrer">
              ask us on WhatsApp
            </a>
            .
          </p>
        </div>
        <div className="faq-list">
          {faqs.map(([q, a], i) => (
            <details key={q} className="faq-item" open={i === 0}>
              <summary>
                {q}
                <span className="faq-icon" aria-hidden="true" />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd([
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: site.name,
              url: site.url,
              telephone: site.phoneE164,
              email: site.email,
              brand: { "@type": "Brand", name: "C3M" },
              address: {
                "@type": "PostalAddress",
                streetAddress: site.address.street,
                addressLocality: site.address.city,
                postalCode: site.address.postalCode,
                addressCountry: "PK",
              },
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
            },
          ]),
        }}
      />
    </>
  );
}
