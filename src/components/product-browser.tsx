"use client";

import { useMemo, useState } from "react";
import { ProductGrid } from "@/components/product-grid";
import { useCart } from "@/components/cart-provider";
import { usePreferences } from "@/components/preferences-provider";
import { localizeCategory, localizeProduct } from "@/lib/i18n";

export function ProductBrowser({
  initialQuery = "",
  initialCategory = "",
}: {
  initialQuery?: string;
  initialCategory?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState("recommended");
  const { locale, t } = usePreferences();
  const { products, categories } = useCart();

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesCategory = !category || product.category === category;
      const matchesQuery = !normalizedQuery ||
        (product.name + " " + product.category + " " + product.description + " " + localizeProduct(product, locale).name + " " + localizeProduct(product, locale).category + " " + localizeProduct(product, locale).description).toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });

    if (sort === "price-low") return filtered.sort((a, b) => a.price - b.price);
    if (sort === "price-high") return filtered.sort((a, b) => b.price - a.price);
    return filtered;
  }, [category, locale, query, sort]);

  return (
    <div className="catalog-browser">
      <div className="catalog-tools">
        <label className="catalog-search">
          <span className="sr-only">{t("Search products")}</span>
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("What are you looking for?")} />
        </label>
        <label className="sort-control">
          <span>{t("Sort by")}</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="recommended">{t("Recommended")}</option>
            <option value="price-low">{t("Price: low to high")}</option>
            <option value="price-high">{t("Price: high to low")}</option>
          </select>
        </label>
      </div>
      <div className="filter-row" aria-label="Filter by category">
        <button type="button" aria-pressed={!category} className={!category ? "filter-chip active" : "filter-chip"} onClick={() => setCategory("")}>{t("All pieces")}</button>
        {categories.map((item) => (
          <button
            key={item.name}
            type="button"
            aria-pressed={category === item.name}
            className={category === item.name ? "filter-chip active" : "filter-chip"}
            onClick={() => setCategory(item.name)}
          >
            {localizeCategory(item.name, locale)}
          </button>
        ))}
      </div>
      <div className="catalog-result-count">{visibleProducts.length} {t(visibleProducts.length === 1 ? "piece" : "pieces")} {t("to explore")}</div>
      {visibleProducts.length > 0 ? (
        <ProductGrid items={visibleProducts} />
      ) : (
        <div className="empty-state catalog-empty">
          <div className="empty-state-icon">✦</div>
          <h2>{t("No pieces found")}</h2>
          <p>{t("Try another search or clear the category filter.")}</p>
          <button className="button button-outline" onClick={() => { setQuery(""); setCategory(""); }}>{t("Clear filters")}</button>
        </div>
      )}
    </div>
  );
}
