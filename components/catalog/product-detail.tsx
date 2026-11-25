"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useProductInquiry } from "../product-inquiry";
import { Plus, Check } from "lucide-react";
import type { Product, Industry, Unit } from "@/lib/catalog/types";
import { PhotoImg } from "../product-photo";
import { getPhotos, type Photo } from "@/lib/catalog/media";
import {
  getVideo,
  videoPoster,
  videoSources,
  type ProductVideo,
} from "@/lib/catalog/videos";
import { LoopVideo } from "../loop-video";
import { useBasket } from "@/lib/basket";
import { unitLabel } from "@/lib/catalog/units";
import { whatsappLink } from "@/lib/site";

export function ProductDetail({
  product,
  industries,
}: {
  product: Product;
  industries: Industry[];
}) {
  const [sku, setSku] = useState(product.variants[0]?.sku ?? ""),
    [quantity, setQuantity] = useState("1"),
    [unit, setUnit] = useState<Unit>(product.variants[0]?.units[0] ?? "pcs"),
    [error, setError] = useState(""),
    [added, setAdded] = useState(false);
  const { add } = useBasket();
  const { setProduct } = useProductInquiry();
  useEffect(() => {
    setProduct({
      name: product.name,
      sku,
      specifications: product.specs
        .filter((s) => s.value)
        .map((s) => `${s.label}: ${s.value}`),
    });
    return () => setProduct(null);
  }, [product, sku, setProduct]);
  const photos = [
    ...getPhotos(product.slug),
    ...(product.media ?? []).map((m) => ({ base: m.url, url: m.url, alt: m.alt, studio: false })),
  ];
  const known = product.specs.filter((sp) => sp.value);
  const unknown = product.specs.filter((sp) => !sp.value);
  const variant = product.variants.find((v) => v.sku === sku);
  const multiUnit = (variant?.units.length ?? 0) > 1;
  function addToQuote(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const n = Number(quantity);
    if (
      !variant ||
      !Number.isFinite(n) ||
      n <= 0 ||
      n > 10000000 ||
      (unit === "pcs" && !Number.isInteger(n))
    ) {
      setError("Enter a valid quantity. Pieces must be whole numbers.");
      return;
    }
    if (variant.minQty && n < variant.minQty) {
      setError(`Minimum quantity: ${variant.minQty} ${unitLabel[unit]}.`);
      return;
    }
    setError("");
    if (add({ sku, quantity: n, unit })) setAdded(true);
  }
  return (
    <div className="product-main">
      <Gallery photos={photos} video={getVideo(product.slug)} />
      <div className="product-summary">
        {product.family !== product.name && (
          <p className="product-family">{product.family}</p>
        )}
        <h1>{product.name}</h1>
        {product.model && (
          <p className="product-model">Model {product.model}</p>
        )}
        <p className="product-lede">{product.description}</p>
        <div className="product-badges">
          {industries
            .filter((i) => product.industries.includes(i.slug))
            .map((i) => (
              <Link key={i.slug} href={`/industries/${i.slug}`} prefetch>
                {i.name}
              </Link>
            ))}
        </div>
        <form className="quote-panel" onSubmit={addToQuote}>
          {/* Selectors appear only when there is a real choice; one option is just stated in the labels. */}
          {product.variants.length > 1 && (
            <>
              <label className="field-label" htmlFor="product-variant">
                Variant
              </label>
              <select
                className="form-control"
                id="product-variant"
                value={sku}
                onChange={(e) => {
                  const next = product.variants.find(
                    (v) => v.sku === e.target.value,
                  );
                  setSku(e.target.value);
                  if (next) setUnit(next.units[0]);
                  setAdded(false);
                }}
              >
                {product.variants.map((v) => (
                  <option key={v.sku} value={v.sku}>
                    {v.name === "To confirm"
                      ? "Confirm specification with our team"
                      : v.name}
                    {!v.sku.endsWith("-TBC") ? ` · ${v.sku}` : ""}
                  </option>
                ))}
              </select>
            </>
          )}
          <div className={`quantity-row ${multiUnit ? "" : "quantity-single"}`}>
            <label>
              <span className="field-label">
                {multiUnit
                  ? "Quantity"
                  : `Quantity (${unitLabel[unit].toLowerCase()})`}
              </span>
              <input
                className="form-control"
                type="number"
                min={variant?.minQty ?? (unit === "pcs" ? 1 : 0.001)}
                max="10000000"
                step={unit === "pcs" ? 1 : "any"}
                inputMode="decimal"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setAdded(false);
                }}
                required
                aria-invalid={!!error}
                aria-describedby={error ? "quantity-error" : undefined}
              />
            </label>
            {multiUnit && (
              <label>
                <span className="field-label">Unit</span>
                <select
                  className="form-control"
                  value={unit}
                  onChange={(e) => {
                    setUnit(e.target.value as Unit);
                    setAdded(false);
                  }}
                >
                  {variant?.units.map((u) => (
                    <option key={u} value={u}>
                      {unitLabel[u]}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          {error && (
            <p id="quantity-error" className="field-error" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="button button-full"
            disabled={!variant}
          >
            {added ? "Added to your quote" : "Add to quote"}
            {added ? <Check size={19} /> : <Plus size={19} />}
          </button>
          {added && (
            <Link className="view-quote" href="/quote">
              Review your quote list
            </Link>
          )}
          <p className="form-footnote">
            Pricing, minimum quantity and delivery are confirmed with your
            quotation. Adding an item does not place an order.
          </p>
        </form>
        <section className="spec-panel">
          <h2>Technical details</h2>
          {/* Confirmed values as rows; unknown ones grouped into one honest line instead of a column of blanks. */}
          {known.length > 0 && (
            <table className="spec-table">
              <tbody>
                {known.map((spec) => (
                  <tr key={spec.label}>
                    <th scope="row">{spec.label}</th>
                    <td>{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {unknown.length > 0 && (
            <p className="spec-pending">
              Confirmed with your quotation:{" "}
              {unknown.map((s) => s.label.toLowerCase()).join(", ")}.{" "}
              <a
                href={whatsappLink(
                  `Hello, I would like to confirm the ${unknown.map((s) => s.label.toLowerCase()).join(", ")} for ${product.name}${product.model ? ` (${product.model})` : ""}.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ask about these on WhatsApp
              </a>
            </p>
          )}
          {product.specNote && <p className="spec-note">{product.specNote}</p>}
        </section>
        <p className="product-contact">
          Need a different size or rating?{" "}
          <a
            href={whatsappLink(
              `Hello, I would like to discuss a different specification for ${product.name}.`,
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            Talk to us on WhatsApp
          </a>
        </p>
      </div>
    </div>
  );
}

function Gallery({ photos, video }: { photos: Photo[]; video?: ProductVideo }) {
  const [active, setActive] = useState(0);
  const showVideo = video && active === photos.length; // the breakdown video sits after the photos
  const photo = photos[active];
  return (
    <div className="gallery">
      <div className="gallery-main">
        {showVideo ? (
          <LoopVideo
            sources={videoSources(video.base)}
            poster={videoPoster(video.base)}
            label={video.title}
            className="gallery-video"
          />
        ) : (
          photo && (
            <PhotoImg
              key={active}
              photo={photo}
              sizes="(max-width: 900px) 92vw, 50vw"
              eager
            />
          )
        )}
      </div>
      {photos.length + (video ? 1 : 0) > 1 && (
        <div
          className="gallery-thumbs"
          role="group"
          aria-label="Product photos and video"
        >
          {photos.map((p, i) => (
            <button
              key={p.base}
              aria-label={`Show photo ${i + 1}: ${p.alt}`}
              aria-current={i === active || undefined}
              onClick={() => setActive(i)}
            >
              <PhotoImg photo={p} sizes="96px" />
            </button>
          ))}
          {video && (
            <button
              className="thumb-video"
              aria-label={`Play breakdown video: ${video.title}`}
              aria-current={showVideo || undefined}
              onClick={() => setActive(photos.length)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={videoPoster(video.base)} alt="" loading="lazy" />
              <span aria-hidden="true">▶</span>
            </button>
          )}
        </div>
      )}
      {video && (
        <p className="gallery-note">
          {showVideo
            ? "Typical construction; exact specification confirmed with your quotation."
            : "Includes a breakdown video. Select ▶ to play."}
        </p>
      )}
    </div>
  );
}
