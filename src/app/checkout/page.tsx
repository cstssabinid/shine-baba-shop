"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { products } from "@/lib/catalog";
import { formatUsd } from "@/lib/format";
import { usePreferences } from "@/components/preferences-provider";
import { localizeOption, localizeProduct } from "@/lib/i18n";

const methods = [
  { id: "mtn", title: "MTN Mobile Money", detail: "Pay with MTN MoMo" },
  { id: "airtel", title: "Airtel Money", detail: "Pay with Airtel Money" },
  { id: "visa", title: "Visa", detail: "Credit or debit card" },
  { id: "mastercard", title: "Mastercard", detail: "Credit or debit card" },
];

export default function CheckoutPage() {
  const { items, subtotal, ready, clearCart } = useCart();
  const { locale, t } = usePreferences();
  const [method, setMethod] = useState("mtn");
  const [reference, setReference] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length || reference) return;
    const newReference = "SBS-" + Date.now().toString().slice(-7);
    setReference(newReference);
    clearCart();
  }

  if (!ready) return <main className="page-main"><div className="container loading-state">{t("Preparing checkout…")}</div></main>;

  if (reference) {
    return (
      <main className="page-main">
        <section className="container checkout-success empty-state">
          <div className="success-mark">✓</div>
          <p className="eyebrow">{t("Preview only")}</p>
          <h1>{t("Your order preview is ")}<em>{t("ready.")}</em></h1>
          <p>{t("Sample reference")} <strong>{reference}</strong> · {methods.find((item) => item.id === method)?.title}</p>
          <div className="preview-callout">
            {t("No order was sent, no personal details were saved, and no payment was collected. A live checkout will be connected after the database, delivery rules, and Rwanda-supported payment provider are configured.")}
          </div>
          <Link href="/products" className="button button-dark">{t("Back to the shop")} <span>↗</span></Link>
        </section>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="page-main">
        <section className="container empty-state cart-empty">
          <div className="empty-state-icon">✦</div>
          <h1>{t("Your bag is ")}<em>{t("empty.")}</em></h1>
          <p>{t("Add a sample item to preview the checkout flow.")}</p>
          <Link href="/products" className="button button-dark">{t("Explore the shop")} <span>↗</span></Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-main">
      <section className="page-hero compact-page-hero">
        <div className="container"><p className="eyebrow">{t("A simple and secure checkout")}</p><h1>{t("Almost ")}<em>{t("yours.")}</em></h1></div>
      </section>
      <section className="container checkout-layout section">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <div className="checkout-section">
            <div className="checkout-section-title"><span>01</span><div><h2>{t("Contact details")}</h2><p>{t("Where can we reach you about your order?")}</p></div></div>
            <div className="field-grid">
              <label>{t("Full name")}<input name="name" autoComplete="name" required placeholder={t("Your name")} /></label>
              <label>{t("Phone number")}<input name="phone" autoComplete="tel" required placeholder="+250 ..." /></label>
              <label className="field-wide">{t("Email address")} <span className="optional-label">{t("Optional")}</span><input name="email" type="email" autoComplete="email" placeholder="you@example.com" /></label>
            </div>
          </div>
          <div className="checkout-section">
            <div className="checkout-section-title"><span>02</span><div><h2>{t("Delivery location")}</h2><p>{t("Our team will confirm the delivery fee with you.")}</p></div></div>
            <div className="field-grid">
              <label>{t("District")}<input name="district" autoComplete="address-level2" required placeholder="e.g. Gasabo" /></label>
              <label>{t("Sector or neighborhood")}<input name="sector" required placeholder={t("Your area")} /></label>
              <label className="field-wide">{t("Street address / directions")}<textarea name="address" autoComplete="street-address" rows={3} required placeholder={t("Add a nearby landmark or delivery directions")} /></label>
            </div>
          </div>
          <div className="checkout-section">
            <div className="checkout-section-title"><span>03</span><div><h2>{t("Payment method")}</h2><p>{t("These are the payment options planned for launch.")}</p></div></div>
            <div className="payment-method-list">
              {methods.map((item) => (
                <label className={method === item.id ? "payment-method selected" : "payment-method"} key={item.id}>
                  <input type="radio" name="payment" value={item.id} checked={method === item.id} onChange={() => setMethod(item.id)} />
                  <span className="payment-radio" />
                  <span className="payment-method-copy"><strong>{item.title}</strong><small>{t(item.detail)}</small></span>
                  <span className={"method-mark method-" + item.id}>{item.id === "mtn" ? "MTN" : item.id === "airtel" ? "Airtel" : item.id === "visa" ? "VISA" : "MC"}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="checkout-preview-banner"><strong>{t("Preview checkout")}</strong><span>{t("No payment will be taken. This form does not send or save your details.")}</span></div>
          <button className="button button-dark button-full checkout-submit" type="submit">{t("Preview my order")} <span>↗</span></button>
        </form>
        <aside className="cart-summary checkout-summary">
          <p className="eyebrow">{t("Your selection")}</p>
          <h2>{t("In your bag")}</h2>
          <div className="checkout-items">
            {items.map((line) => {
              const sourceProduct = products.find((entry) => entry.slug === line.slug);
              if (!sourceProduct) return null;
              const product = localizeProduct(sourceProduct, locale);
              return <div className="checkout-item" key={line.slug + "::" + (line.option ?? "")}><span>{product.name}{line.option ? " · " + localizeOption(sourceProduct, line.option, locale) : ""} <b>× {line.quantity}</b></span><strong>{formatUsd(product.price * line.quantity)}</strong></div>;
            })}
          </div>
          <div className="summary-row"><span>{t("Subtotal")}</span><strong>{formatUsd(subtotal)}</strong></div>
          <div className="summary-row"><span>{t("Delivery")}</span><span>{t("To be confirmed")}</span></div>
          <div className="summary-total"><span>{t("Estimated total")}</span><strong>{formatUsd(subtotal)}</strong></div>
          <p className="summary-note">{t("Final delivery fee and payment instructions will be confirmed with the shop.")}</p>
          <Link className="text-link" href="/cart">← {t("Back to your bag")}</Link>
        </aside>
      </section>
    </main>
  );
}
