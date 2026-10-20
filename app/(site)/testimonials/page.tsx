import { notFound } from "next/navigation";
import { Letters } from "@/components/motion";
import { PakistanMap } from "@/components/pakistan-map";
import { ClientGrid, TestimonialCards } from "@/components/proof";
import { metadataFor } from "@/lib/seo";
import { showSamples, testimonials } from "@/lib/proof";

export const metadata = metadataFor(
  "Testimonials",
  "What appliance makers and workshops across Pakistan say about sourcing components from MB International Traders.",
  "/testimonials",
);

export default function Testimonials() {
  if (testimonials.length === 0) notFound();
  return (
    <>
      <section className="container page-head">
        <Letters as="h1" text="Testimonials" />
        <p>
          From cooler lines in Gujranwala to workshops in Karachi. Hear from the people who
          source their components with us.
        </p>
        {showSamples && (
          <p className="sample-note">
            Sample testimonials shown for design review. They are hidden automatically at launch.
          </p>
        )}
      </section>
      <section className="container pk-section" aria-label="Where our customers are">
        <PakistanMap people={testimonials} />
      </section>
      <section className="container section" aria-labelledby="experiences-title">
        <div className="split-head">
          <p className="side-label">Customer experiences</p>
          <Letters as="h2" id="experiences-title" className="display" text="Experiences" />
        </div>
        <TestimonialCards items={testimonials} summary={false} />
      </section>
      <section className="container section" aria-labelledby="clients-title">
        <div className="split-head">
          <p className="side-label">Our clients</p>
          <Letters as="h2" id="clients-title" className="display" text="Trusted in Gujranwala" />
        </div>
        <ClientGrid />
      </section>
    </>
  );
}
