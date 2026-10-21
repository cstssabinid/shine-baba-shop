"use client";

import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { formatUsd } from "@/lib/format";
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
          <strong>{formatUsd(item.price)}</strong>
          {item.options
            ? <Link href={"/products/" + item.slug} className="button button-outline button-small">{t("Choose")}</Link>
            : <AddToCartButton slug={item.slug} label={t("Add")} className="button-small" />}
        </div>
      </div>
    </article>
  );
}
