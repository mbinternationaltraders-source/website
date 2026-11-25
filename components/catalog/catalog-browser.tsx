"use client";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { Product, Industry } from "@/lib/catalog/types";
import { ProductCard } from "./product-card";
import { matchesSearch } from "@/lib/catalog/search";
export function CatalogBrowser({
  products,
  industries,
}: {
  products: Product[];
  industries: Industry[];
}) {
  const [search, setSearch] = useState(""),
    [industry, setIndustry] = useState("all"),
    [sort, setSort] = useState("featured");
  const result = useMemo(() => {
    let list = products.filter(
      (p) =>
        (industry === "all" || p.industries.includes(industry)) &&
        matchesSearch(p, search),
    );
    if (sort === "name")
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, search, industry, sort]);
  return (
    <>
      <div className="catalog-tools">
        <label className="search-field">
          <Search size={19} />
          <input
            aria-label="Search products"
            placeholder="Search by product, model or SKU"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button aria-label="Clear search" onClick={() => setSearch("")}>
              <X size={17} />
            </button>
          )}
        </label>
        <label className="sort-field">
          Sort by{" "}
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="featured">Featured</option>
            <option value="name">Name: A–Z</option>
          </select>
        </label>
      </div>
      <div className="filter-row" role="group" aria-label="Filter by industry">
        <button
          aria-pressed={industry === "all"}
          onClick={() => setIndustry("all")}
        >
          All
        </button>
        {industries.map((i) => (
          <button
            key={i.slug}
            aria-pressed={industry === i.slug}
            onClick={() => setIndustry(i.slug)}
          >
            {i.name}
          </button>
        ))}
      </div>
      <p className="catalog-count" aria-live="polite">
        {result.length} {result.length === 1 ? "product" : "products"}
      </p>
      {result.length ? (
        <div className="product-grid">
          {result.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No matching components.</h2>
          <p>Try another product name or select a different industry.</p>
          <button
            className="button button-outline"
            onClick={() => {
              setSearch("");
              setIndustry("all");
            }}
          >
            Reset filters
          </button>
        </div>
      )}
    </>
  );
}
