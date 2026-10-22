"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { usePreferences } from "@/components/preferences-provider";
import { formatUsd } from "@/lib/format";
import { localizeOption, localizeProduct } from "@/lib/i18n";
import { submitOrder } from "@/app/checkout/actions";

const methods = [
  { id: "mtn", title: "MTN Mobile Money", detail: "Pay with MTN MoMo" },
  { id: "airtel", title: "Airtel Money", detail: "Pay with Airtel Money" },
  { id: "visa", title: "Visa", detail: "Credit or debit card" },
  { id: "mastercard", title: "Mastercard", detail: "Credit or debit card" },
];

export default function CheckoutPage() {
  const { items, products, subtotal, ready } = useCart();
  const { locale, t } = usePreferences();
  const [method, setMethod] = useState("mtn");
  const [requestKey, setRequestKey] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setRequestKey(window.crypto.randomUUID());
    const code = new URLSearchParams(window.location.search).get("error");
    if (code === "stock") setError(t("Some items are no longer available in that quantity. Please update your bag."));
    else if (code === "details") setError(t("Check your contact and delivery details, then try again."));
    else if (code === "failed") setError(t("We could not submit that order. Please try again."));
  }, [t]);

  const canOrder = useMemo(() => items.length > 0 && items.every((line) => {
    const product = products.find((entry) => entry.slug === line.slug);
    const variant = product?.variants?.find((entry) => entry.label === (line.option ?? "Default")) ?? product?.variants?.[0];
    return Boolean(variant && variant.stockQuantity !== null && variant.stockQuantity >= line.quantity);
  }), [items, products]);

  if (!ready) return <main className="page-main"><div className="container loading-state">{t("Preparing checkout…")}</div></main>;

  if (!items.length) {
    return <main className="page-main"><section className="container empty-state cart-empty"><div className="empty-state-icon">✦</div><h1>{t("Your bag is ")}<em>{t("empty.")}</em></h1><p>{t("Add a product with a counted stock quantity to place an order request.")}</p><Link href="/products" className="button button-dark">{t("Explore the shop")}</Link></section></main>;
  }

  return (
    <main className="page-main">
      <section className="page-hero compact-page-hero"><div className="container"><p className="eyebrow">{t("A simple and secure checkout")}</p><h1>{t("Almost ")}<em>{t("yours.")}</em></h1></div></section>
      <section className="container checkout-layout section">
        <form action={submitOrder} className="checkout-form">
          <input type="hidden" name="cart" value={JSON.stringify(items)} />
          <input type="hidden" name="requestKey" value={requestKey} />
          <div className="checkout-section">
            <div className="checkout-section-title"><span>01</span><div><h2>{t("Contact details")}</h2><p>{t("Where can we reach you about your order?")}</p></div></div>
            <div className="field-grid">
              <label>{t("Full name")}<input name="name" autoComplete="name" required maxLength={120} placeholder={t("Your name")} /></label>
              <label>{t("Phone number")}<input name="phone" autoComplete="tel" required maxLength={24} placeholder="+250 ..." /></label>
            </div>
          </div>
          <div className="checkout-section">
            <div className="checkout-section-title"><span>02</span><div><h2>{t("Delivery location")}</h2><p>{t("Our team will confirm the delivery fee with you.")}</p></div></div>
            <div className="field-grid">
              <label>{t("District")}<input name="district" autoComplete="address-level2" required maxLength={100} placeholder="e.g. Gasabo" /></label>
              <label>{t("Sector or neighborhood")}<input name="sector" required maxLength={100} placeholder={t("Your area")} /></label>
              <label className="field-wide">{t("Street address / directions")}<textarea name="directions" autoComplete="street-address" rows={3} required maxLength={500} placeholder={t("Add a nearby landmark or delivery directions")} /></label>
            </div>
          </div>
          <div className="checkout-section">
            <div className="checkout-section-title"><span>03</span><div><h2>{t("Payment method")}</h2><p>{t("Choose the method you plan to use. The shop will confirm payment with you.")}</p></div></div>
            <div className="payment-method-list">
              {methods.map((item) => <label className={method === item.id ? "payment-method selected" : "payment-method"} key={item.id}>
                <input type="radio" name="paymentMethod" value={item.id} checked={method === item.id} onChange={() => setMethod(item.id)} />
                <span className="payment-radio" /><span className="payment-method-copy"><strong>{item.title}</strong><small>{t(item.detail)}</small></span>
                <span className={"method-mark method-" + item.id}>{item.id === "mtn" ? "MTN" : item.id === "airtel" ? "Airtel" : item.id === "visa" ? "VISA" : "MC"}</span>
              </label>)}
            </div>
          </div>
          {error && <div className="manager-alert error" role="alert">{error}</div>}
          <div className="checkout-preview-banner"><strong>{t("Order request only")}</strong><span>{t("This saves your order request and reserves counted stock. It does not collect payment. The shop will confirm the final price, delivery fee, and payment before dispatch.")}</span></div>
          <button className="button button-dark button-full checkout-submit" type="submit" disabled={!canOrder || !requestKey}>{canOrder ? t("Send order request") : t("Stock must be counted before ordering")}</button>
        </form>
        <aside className="cart-summary checkout-summary">
          <p className="eyebrow">{t("Your selection")}</p><h2>{t("In your bag")}</h2>
          <div className="checkout-items">
            {items.map((line) => {
              const sourceProduct = products.find((entry) => entry.slug === line.slug);
              if (!sourceProduct) return <div className="checkout-item" key={line.slug}>{t("This item is no longer available. Remove it from your bag.")}</div>;
              const product = localizeProduct(sourceProduct, locale);
              const variant = sourceProduct.variants?.find((entry) => entry.label === (line.option ?? "Default")) ?? sourceProduct.variants?.[0];
              const price = variant?.price ?? sourceProduct.price;
              return <div className="checkout-item" key={line.slug + "::" + (line.option ?? "")}><span>{product.name}{line.option ? " · " + localizeOption(sourceProduct, line.option, locale) : ""} <b>× {line.quantity}</b></span><strong>{formatUsd(price * line.quantity)}</strong></div>;
            })}
          </div>
          <div className="summary-row"><span>{t("Subtotal")}</span><strong>{formatUsd(subtotal)}</strong></div>
          <div className="summary-row"><span>{t("Delivery")}</span><span>{t("To be confirmed")}</span></div>
          <div className="summary-total"><span>{t("Estimated total")}</span><strong>{formatUsd(subtotal)}</strong></div>
          <p className="summary-note">{t("Displayed prices remain random placeholders. The shop will confirm the amount before payment.")}</p>
          <Link className="text-link" href="/cart">← {t("Back to your bag")}</Link>
        </aside>
      </section>
    </main>
  );
}
