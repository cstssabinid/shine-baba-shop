"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { ProductArt } from "@/components/product-art";
import { formatUsd } from "@/lib/format";
import { localizeOption, localizeProduct } from "@/lib/i18n";
import { usePreferences } from "@/components/preferences-provider";

export default function CartPage() {
  const { items, products, subtotal, ready, setQuantity, removeItem } = useCart();
  const { locale, t } = usePreferences();

  if (!ready) {
    return <main className="page-main"><div className="container loading-state">{t("Getting your bag ready…")}</div></main>;
  }

  if (items.length === 0) {
    return (
      <main className="page-main">
        <section className="container empty-state cart-empty">
          <div className="empty-state-icon">✳</div>
          <p className="eyebrow">{t("Your bag is taking a little breather")}</p>
          <h1>{t("Nothing in your ")}<em>{t("bag yet.")}</em></h1>
          <p>{t("Take a look around and find something you love.")}</p>
          <Link className="button button-dark" href="/products">{t("Explore the shop")} <span>↗</span></Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-main">
      <section className="page-hero compact-page-hero">
        <div className="container"><p className="eyebrow">{t("Just a few more steps")}</p><h1>{t("Your ")}<em>{t("bag.")}</em></h1></div>
      </section>
      <section className="container cart-layout section">
        <div className="cart-list">
          <div className="cart-list-heading"><span>{t("Item")}</span><span>{t("Quantity")}</span><span>{t("Total")}</span></div>
          {items.map((line) => {
            const sourceProduct = products.find((entry) => entry.slug === line.slug);
            if (!sourceProduct) return <article className="cart-line" key={line.slug + "::unavailable"}><div className="cart-line-copy"><p className="eyebrow">{t("Unavailable")}</p><strong>{line.slug}</strong><p className="cart-line-option">{t("This product is no longer in the live catalog.")}</p><button className="remove-link" onClick={() => removeItem(line.slug, line.option)} type="button">{t("Remove")}</button></div></article>;
            const product = localizeProduct(sourceProduct, locale);
            const variant = sourceProduct.variants?.find((entry) => entry.label === (line.option ?? "Default")) ?? sourceProduct.variants?.[0];
            const linePrice = variant?.price ?? sourceProduct.price;
            return (
              <article className="cart-line" key={line.slug + "::" + (line.option ?? "")}>
                <Link className="cart-line-art" href={"/products/" + product.slug}><ProductArt product={product} compact /></Link>
                <div className="cart-line-copy">
                  <p className="eyebrow">{product.category}</p>
                  <Link href={"/products/" + product.slug} className="cart-line-title">{product.name}</Link>
                  {line.option && <p className="cart-line-option">{product.options?.label}: {localizeOption(sourceProduct, line.option, locale)}</p>}
                  <p className="cart-line-price">{formatUsd(linePrice)}</p>
                  {variant?.stockQuantity === null && <p className="cart-line-option">{t("Stock not set; this item cannot be ordered yet.")}</p>}
                  {variant && variant.stockQuantity !== null && line.quantity > variant.stockQuantity && <p className="cart-line-option">{t("Only")} {variant.stockQuantity} {t("available")}</p>}
                  <button className="remove-link" onClick={() => removeItem(line.slug, line.option)} type="button">{t("Remove")}</button>
                </div>
                <div className="quantity-control" aria-label={t("Quantity") + " · " + product.name}>
                  <button type="button" aria-label={t("Decrease quantity")} onClick={() => setQuantity(line.slug, line.option, line.quantity - 1)}>−</button>
                  <span>{line.quantity}</span>
                  <button type="button" aria-label={t("Increase quantity")} onClick={() => setQuantity(line.slug, line.option, line.quantity + 1)}>+</button>
                </div>
                <strong className="cart-line-total">{formatUsd(linePrice * line.quantity)}</strong>
              </article>
            );
          })}
          <Link href="/products" className="text-link continue-shopping">← {t("Continue shopping")}</Link>
        </div>
        <aside className="cart-summary">
          <p className="eyebrow">{t("Order summary")}</p>
          <h2>{t("A good choice.")}</h2>
          <div className="summary-row"><span>{t("Subtotal")}</span><strong>{formatUsd(subtotal)}</strong></div>
          <div className="summary-row"><span>{t("Delivery")}</span><span>{t("To be confirmed")}</span></div>
          <div className="summary-total"><span>{t("Estimated total")}</span><strong>{formatUsd(subtotal)}</strong></div>
          <p className="summary-note">{t("Delivery fee and payment are confirmed with the shop. Order requests reserve counted stock but do not collect payment online.")}</p>
          <Link className="button button-dark button-full" href="/checkout">{t("Continue to checkout")} <span>↗</span></Link>
          <div className="cart-payment-note"><span>MoMo</span><span>Airtel</span><span>VISA</span><span>Mastercard</span></div>
        </aside>
      </section>
    </main>
  );
}
