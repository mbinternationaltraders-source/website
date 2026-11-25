"use client";
import Link from "next/link";
import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import type { Product } from "@/lib/catalog/types";
import { useBasket, type BasketItem } from "@/lib/basket";
import { quantityError, quoteMessage } from "@/lib/quote-list";
import { unitLabel } from "@/lib/catalog/units";
import { ProductPhoto } from "./product-photo";
import { EnquiryForm } from "./enquiry-form";
import { whatsappLink } from "@/lib/site";
import { PageLoader } from "./page-loader";
export function QuoteBasket({ products }: { products: Product[] }) {
  const { items, ready, update, remove, clear } = useBasket();
  // Only rejected edits live here; the basket stays the single source of truth for accepted quantities,
  // so re-adding an item elsewhere or removing it can never leave a stale number or stale error behind.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const keyOf = (i: BasketItem) => `${i.sku}-${i.unit}`;
  const minimumOf = (i: BasketItem) =>
    products.flatMap((p) => p.variants).find((v) => v.sku === i.sku)?.minQty ?? (i.unit === "pcs" ? 1 : 0.001);
  const hasInvalid = items.some((i) => keyOf(i) in drafts);
  const setDraft = (key: string, value: string | null) =>
    setDrafts((current) => {
      const next = { ...current };
      if (value === null) delete next[key];
      else next[key] = value;
      return next;
    });
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
  const message = quoteMessage(items, products);
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
                    onClick={() => {
                      setDraft(keyOf(item), null);
                      remove(item.sku, item.unit);
                    }}
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
                  <label>
                    <span className="field-label">Quantity</span>
                    <input
                      className="form-control"
                      aria-label={`Quantity for ${product?.name ?? item.sku}`}
                      type="number"
                      inputMode="decimal"
                      min={minimumOf(item)}
                      max="10000000"
                      step={item.unit === "pcs" ? 1 : "any"}
                      value={drafts[keyOf(item)] ?? String(item.quantity)}
                      aria-invalid={keyOf(item) in drafts}
                      aria-describedby={keyOf(item) in drafts ? `qty-${keyOf(item)}` : undefined}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (quantityError(value, item.unit, minimumOf(item))) return setDraft(keyOf(item), value);
                        setDraft(keyOf(item), null);
                        update(item.sku, item.unit, { quantity: Number(value) });
                      }}
                    />
                    {keyOf(item) in drafts && (
                      <span className="field-error" id={`qty-${keyOf(item)}`}>
                        {quantityError(drafts[keyOf(item)], item.unit, minimumOf(item))}
                      </span>
                    )}
                  </label>
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
            <>
              <a href={whatsappLink(message)} target="_blank" rel="noopener noreferrer">
                Discuss this list on WhatsApp
              </a>
              . The message includes each item, SKU, quantity and note, and you review it before sending.
            </>
          )}
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
