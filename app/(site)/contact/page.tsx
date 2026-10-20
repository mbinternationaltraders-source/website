import { site, addressLines, whatsappLink } from "@/lib/site";
import { ContactMap } from "@/components/contact-map";
import { EnquiryForm } from "@/components/enquiry-form";
import { metadataFor } from "@/lib/seo";
import { Letters } from "@/components/motion";
export const metadata = metadataFor(
  "Contact & location",
  "Talk to MB International Traders about industrial and appliance components. Find us at Ali Pur Chowk, GT Road Bypass, Gujranwala.",
  "/contact",
);
export default function Contact() {
  return (
    <>
      <section className="container page-head">
        <Letters as="h1" text="Contact" />
        <p>
          A part number, a photo or a bulk requirement. WhatsApp is usually the
          fastest way to reach us.
        </p>
      </section>
      <section className="container section-tight contact-layout">
        <div className="contact-information">
          <div className="contact-block">
            <h2>Call or WhatsApp</h2>
            <a href={`tel:${site.phoneE164}`}>{site.phoneDisplay}</a>
            <a
              className="text-link"
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
            >
              Start a WhatsApp conversation
            </a>
          </div>
          <div className="contact-block">
            <h2>Email our team</h2>
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </div>
          <div className="contact-block">
            <h2>Visit us in Gujranwala</h2>
            <p>
              {addressLines.map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
              Pakistan
            </p>
            <a
              className="text-link"
              href={site.directions}
              target="_blank"
              rel="noopener noreferrer"
            >
              Get directions
            </a>
          </div>
          <div className="contact-block">
            <h2>Contact hours</h2>
            <p>
              {site.hours}
              <br />
              Please call ahead to arrange a visit.
            </p>
          </div>
        </div>
        <div className="contact-form-box">
          <h2>What can we help with?</h2>
          <EnquiryForm kind="contact" />
        </div>
      </section>
      <section className="container section map-section">
        <ContactMap />
      </section>
    </>
  );
}
