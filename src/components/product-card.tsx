"use client";

import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { PriceDisplay } from "@/components/price-display";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductArt } from "@/components/product-art";
import { usePreferences } from "@/components/preferences-provider";
import { localizeProduct, localizeCategory } from "@/lib/i18n";

export function ProductCard({ product }: { product: Product }) {
  const { locale, t } = usePreferences();
  const item = localizeProduct(product, locale);
  return (
    <article className="product-card">
      <Link className="product-card-art-link" href={"/products/" + item.slug}>
        <ProductArt product={item} />
        {item.badge && <span className="product-badge">{item.badge}</span>}
        <span className="product-card-open" aria-label={t("View") + " " + item.name}>↗</span>
      </Link>
      <div className="product-card-copy">
        <p className="eyebrow product-category">{localizeCategory(product.category, locale)}</p>
        <Link className="product-card-title" href={"/products/" + item.slug}>{item.name}</Link>
        <div className="product-card-bottom">
          <PriceDisplay usdAmount={item.price} rwfAmount={product.priceRwf} />
          {item.options
            ? <Link href={"/products/" + item.slug} className="button button-outline button-small">{t("Choose")}</Link>
            : <AddToCartButton slug={item.slug} label={t("Add")} className="button-small" disabled={!product.variants?.[0] || product.variants[0].stockQuantity === null || product.variants[0].stockQuantity < 1} />}
        </div>
        <p className="product-stock-note">{product.stockQuantity == null ? t(product.hasUncountedStock ? "Some variant stock is not counted" : "Stock not set") : product.stockQuantity < 1 ? t("Out of stock") : `${product.stockQuantity} ${t("available")}`}</p>
      </div>
    </article>
  );
}
