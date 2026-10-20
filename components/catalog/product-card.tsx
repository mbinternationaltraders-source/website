"use client";
import Link from "next/link";
import { useState } from "react";
import { Plus, Check } from "lucide-react";
import type { Product } from "@/lib/catalog/types";
import { ProductPhoto } from "../product-photo";
import { useBasket } from "@/lib/basket";

export function ProductCard({ product, eager = false }: { product: Product; eager?: boolean }) {
  const [added, setAdded] = useState(false);
  const { add } = useBasket();
  const variant = product.variants[0];
  const href = `/products/${product.slug}`;
  return (
    <article className="product-card">
      <Link href={href} tabIndex={-1} aria-hidden="true" className="card-photo" prefetch>
        <ProductPhoto product={product} eager={eager} />
      </Link>
      <div className="card-body">
        <h3>
          <Link href={href} prefetch>{product.name}</Link>
        </h3>
        <p className="card-model">{product.model ? `Model ${product.model}` : product.summary}</p>
        <ul className="card-specs">
          {product.cardSpecs
            .filter((s) => !s.includes("to confirm"))
            .slice(0, 3)
            .map((s) => (
              <li key={s}>{s}</li>
            ))}
        </ul>
        <button
          className="card-add"
          disabled={!variant}
          aria-label={`Add ${product.name} to quote`}
          onClick={() => {
            if (variant && add({ sku: variant.sku, quantity: variant.minQty || 1, unit: variant.units[0] })) {
              setAdded(true);
              setTimeout(() => setAdded(false), 2500);
            }
          }}
        >
          {added ? <Check size={16} /> : <Plus size={16} />}
          <span aria-live="polite">{added ? "Added to quote" : "Add to quote"}</span>
        </button>
      </div>
    </article>
  );
}
