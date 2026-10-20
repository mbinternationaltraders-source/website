import Link from "next/link";
import { PhotoImg } from "@/components/product-photo";
import { getPhotos } from "@/lib/catalog/media";
import { metadataFor } from "@/lib/seo";
import { Letters } from "@/components/motion";
import { site } from "@/lib/site";

export const metadata = metadataFor(
  "Our company",
  "Meet MB International Traders, the business behind C3M industrial and appliance components in Gujranwala, Pakistan.",
  "/about",
);

export default function About() {
  const lead = getPhotos("water-cooler-pump-lh1020")[3];
  const side = [getPhotos("mini-fan-motor-dc-geared")[0], getPhotos("washer-buttons-and-switches")[0]];
  return (
    <>
      <section className="container page-head">
        <Letters as="h1" text="MB International Traders" />
        <p>
          An importer and supplier of appliance components, based in
          Gujranwala. We sell under our own brand, C3M, to manufacturers,
          assemblers and repair workshops.
        </p>
      </section>

      <section className="container section-tight about-photos">
        {lead && (
          <figure className="about-lead">
            <PhotoImg photo={lead} sizes="(max-width: 800px) 92vw, 60vw" eager />
          </figure>
        )}
        {side.map((p) => p && (
          <figure key={p.base}>
            <PhotoImg photo={p} sizes="(max-width: 800px) 46vw, 30vw" eager />
          </figure>
        ))}
      </section>

      <section className="container section about-columns">
        <div>
          <h2>What we supply</h2>
          <p>
            Pumps and motors for coolers and fans, timers and switches for
            washing machines, heating rods and geyser elements, bearings,
            capacitors and induction cookers. If a part isn’t listed, send us a
            photo and we’ll tell you whether we can supply it.
          </p>
          <Link className="text-link" href="/products">
            See the range
          </Link>
        </div>
        <div>
          <h2>How we work</h2>
          <p>
            Every enquiry starts with a conversation. You tell us the part,
            rating and quantity; we confirm availability, price and delivery
            before anything is ordered. There is no online payment.
          </p>
          <Link className="text-link" href="/quote">
            Start a quote
          </Link>
        </div>
        <div>
          <h2>Where to find us</h2>
          <p>
            {site.address.street}, {site.address.city}. Open {site.hours}.
            Please call ahead before visiting.
          </p>
          <Link className="text-link" href="/contact">
            Contact and directions
          </Link>
        </div>
      </section>
    </>
  );
}
