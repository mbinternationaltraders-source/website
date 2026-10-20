"use client";
import Link from "next/link";
import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import type { Product } from "@/lib/catalog/types";
import { useBasket, type BasketItem } from "@/lib/basket";
import { unitLabel } from "@/lib/catalog/units";
import { ProductPhoto } from "./product-photo";
import { EnquiryForm } from "./enquiry-form";
import { whatsappLink } from "@/lib/site";
import { PageLoader } from "./page-loader";
function Quantity({
  item,
  onChange,
  onValidityChange,
  minimum,
}: {
  item: BasketItem;
  onChange: (n: number) => void;
  onValidityChange: (valid: boolean) => void;
  minimum: number;
}) {
  const [draft, setDraft] = useState(String(item.quantity)),
    [error, setError] = useState("");
  return (
    <label>
      <span className="field-label">Quantity</span>
      <input
        className="form-control"
        aria-label={`Quantity for ${item.sku}`}
        type="number"
        inputMode="decimal"
        min={minimum}
        max="10000000"
        step={item.unit === "pcs" ? 1 : "any"}
        value={draft}
        aria-invalid={!!error}
        onChange={(e) => {
          setDraft(e.target.value);
          const n = Number(e.target.value);
          if (
            n > 0 &&
            n >= minimum &&
            n <= 10000000 &&
            (item.unit !== "pcs" || Number.isInteger(n))
          ) {
            onChange(n);
            setError("");
            onValidityChange(true);
          } else {
            setError(`Enter a valid quantity of at least ${minimum}.`);
            onValidityChange(false);
          }
        }}
      />
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
export function QuoteBasket({ products }: { products: Product[] }) {
  const { items, ready, update, remove, clear } = useBasket();
  const [invalid, setInvalid] = useState<Record<string, boolean>>({});
  const hasInvalid = items.some((i) => invalid[`${i.sku}-${i.unit}`]);
  if (!ready) return <PageLoader />;
  if (!items.length)
    return (
      <div className="empty-state">
        <h2>Your quote list is empty</h2>
        <p>
          Add products from the catalog, choose your quantities and send us your
          requirements.
        </p>
        <Link className="button" href="/products">
          Browse products
        </Link>
      </div>
    );
  const missing = items.filter(
    (i) => !products.some((p) => p.variants.some((v) => v.sku === i.sku)),
  );
  const message = `Hello MB International Traders, I would like a quotation for:\n${items
    .map((i) => {
      const p = products.find((p) => p.variants.some((v) => v.sku === i.sku));
      return `• ${p?.name ?? i.sku}: ${i.quantity} ${unitLabel[i.unit]}`;
    })
    .join("\n")}\nPlease help me confirm the specifications and delivery.`;
  return (
    <div className="quote-layout">
      <section className="quote-items">
        <h2>
          Your requirements <span className="muted">({items.length})</span>
        </h2>
        {items.map((item) => {
          const product = products.find((p) =>
            p.variants.some((v) => v.sku === item.sku),
          );
          const variant = product?.variants.find((v) => v.sku === item.sku);
          return (
            <div className="basket-row" key={`${item.sku}-${item.unit}`}>
              <div className="basket-art">
                {product && <ProductPhoto product={product} />}
              </div>
              <div>
                <div className="basket-item-heading">
                  {product ? (
                    <Link href={`/products/${product.slug}`} prefetch>
                      {product.name}
                    </Link>
                  ) : (
                    <strong>Item no longer available</strong>
                  )}
                  <button
                    aria-label={`Remove ${product?.name ?? item.sku}`}
                    onClick={() => remove(item.sku, item.unit)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <small>
                  {variant?.name === "To confirm"
                    ? "Specification to confirm"
                    : (variant?.name ?? item.sku)}
                </small>
                <div className="basket-controls">
                  <Quantity
                    item={item}
                    minimum={
                      variant?.minQty ?? (item.unit === "pcs" ? 1 : 0.001)
                    }
                    onValidityChange={(valid) =>
                      setInvalid((previous) => ({
                        ...previous,
                        [`${item.sku}-${item.unit}`]: !valid,
                      }))
                    }
                    onChange={(quantity) =>
                      update(item.sku, item.unit, { quantity })
                    }
                  />
                  <span className="basket-unit">{unitLabel[item.unit]}</span>
                </div>
                <input
                  className="basket-note"
                  aria-label={`Requirement note for ${product?.name ?? item.sku}`}
                  placeholder="Add a rating, size or part reference…"
                  maxLength={400}
                  value={item.note ?? ""}
                  onChange={(e) =>
                    update(item.sku, item.unit, { note: e.target.value })
                  }
                />
              </div>
            </div>
          );
        })}
        <Link className="text-link" href="/products">
          <Plus size={15} /> Add more components
        </Link>
        <div className="quote-overview">
          <span>Pricing & availability</span>
          <strong>Confirmed by quotation</strong>
        </div>
        <p className="form-privacy">
          Prefer a conversation?{" "}
          {hasInvalid ? (
            <span>Correct the quantities before opening WhatsApp.</span>
          ) : (
            <a
              href={whatsappLink(message)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Discuss this list on WhatsApp
            </a>
          )}
          . You review the message before sending.
        </p>
      </section>
      <section className="quote-form-card">
        <h2>Let’s get the details.</h2>
        <p>
          Tell us how to reach you. Our team will review your requirements and
          discuss the next step.
        </p>
        {missing.length ? (
          <div className="form-error" role="alert">
            Remove unavailable items before sending this quote.
          </div>
        ) : (
          <>
            {hasInvalid && (
              <p className="form-error" role="alert">
                Correct the quantities in your list before submitting.
              </p>
            )}
            <fieldset className="quote-form-fields" disabled={hasInvalid}>
              <EnquiryForm kind="quote" items={items} onSaved={clear} />
            </fieldset>
          </>
        )}
      </section>
    </div>
  );
}
