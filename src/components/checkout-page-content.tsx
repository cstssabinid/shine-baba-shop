"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { usePreferences } from "@/components/preferences-provider";
import { PriceDisplay } from "@/components/price-display";
import { localizeOption, localizeProduct } from "@/lib/i18n";
import { submitOrder, submitOrderViaWhatsApp } from "@/app/checkout/actions";

export type CheckoutDefaults = {
  fullName: string;
  phone: string;
  district: string;
  sector: string;
  directions: string;
} | null;

const methods = [
  { id: "mtn", title: "MTN Mobile Money", detail: "Pay with MTN MoMo" },
  { id: "airtel", title: "Airtel Money", detail: "Pay with Airtel Money" },
  { id: "visa", title: "Visa", detail: "Credit or debit card" },
  { id: "mastercard", title: "Mastercard", detail: "Credit or debit card" },
];

export function CheckoutPageContent({ profile }: { profile: CheckoutDefaults }) {
  const { items, products, subtotal, ready } = useCart();
  const { locale, t, exchangeRate } = usePreferences();
  const subtotalRwf = items.reduce((sum, line) => {
    const product = products.find((entry) => entry.slug === line.slug);
    if (!product) return sum;
    const variant = product.variants?.find((entry) => entry.label === (line.option ?? "Default")) ?? product.variants?.[0];
    const unitRwf = variant?.priceRwf ?? Math.round((variant?.price ?? product.price) * exchangeRate.usdToRwf);
    return sum + unitRwf * line.quantity;
  }, 0);
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

  if (!ready) return <main className="page-main"><div className="container loading-state">{t("Preparing checkoutâ€¦")}</div></main>;

  if (!items.length) {
    return <main className="page-main"><section className="container empty-state cart-empty"><div className="empty-state-icon">âœ¦</div><h1>{t("Your bag is ")}<em>{t("empty.")}</em></h1><p>{t("Add a product with a counted stock quantity to place an order request.")}</p><Link href="/products" className="button button-dark">{t("Explore the shop")}</Link></section></main>;
  }

  return (
    <main className="page-main">
      <section className="page-hero compact-page-hero"><div className="container"><p className="eyebrow">{t("A simple and secure checkout")}</p><h1>{t("Almost ")}<em>{t("yours.")}</em></h1></div></section>
      <section className="container checkout-layout section">
        <form action={submitOrder} className="checkout-form">
          <input type="hidden" name="cart" value={JSON.stringify(items)} />
          <input type="hidden" name="requestKey" value={requestKey} />
          {profile ? <p className="checkout-saved-note">{t("Signed in: your order request will be saved to your account.")}</p> : <p className="checkout-saved-note">{t("Sign in to keep order requests together and reuse delivery details.")} <Link href="/account">{t("Sign in or create an account")}</Link></p>}
          <div className="checkout-section">
            <div className="checkout-section-title"><span>01</span><div><h2>{t("Contact details")}</h2><p>{t("Where can we reach you about your order?")}</p></div></div>
            <div className="field-grid">
              <label>{t("Full name")}<input name="name" autoComplete="name" required maxLength={120} defaultValue={profile?.fullName ?? ""} placeholder={t("Your name")} /></label>
              <label>{t("Phone number")}<input name="phone" autoComplete="tel" required maxLength={24} defaultValue={profile?.phone ?? ""} placeholder="+250 ..." /></label>
            </div>
          </div>
          <div className="checkout-section">
            <div className="checkout-section-title"><span>02</span><div><h2>{t("Delivery location")}</h2><p>{t("Our team will confirm the delivery fee with you.")}</p></div></div>
            <div className="field-grid">
              <label>{t("District")}<input name="district" autoComplete="address-level2" required maxLength={100} defaultValue={profile?.district ?? ""} placeholder="e.g. Gasabo" /></label>
              <label>{t("Sector or neighborhood")}<input name="sector" required maxLength={100} defaultValue={profile?.sector ?? ""} placeholder={t("Your area")} /></label>
              <label className="field-wide">{t("Street address / directions")}<textarea name="directions" autoComplete="street-address" rows={3} required maxLength={500} defaultValue={profile?.directions ?? ""} placeholder={t("Add a nearby landmark or delivery directions")} /></label>
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
          <div className="checkout-preview-banner"><strong>{t("Choose how to send your order")}</strong><span>{t("Whichever option you choose, your order is saved and counted stock is reserved. WhatsApp opens a ready-to-send message. No payment is collected online; the shop confirms delivery and payment with you.")}</span></div>
          <div className="checkout-order-options">
            <button className="button button-whatsapp button-full checkout-submit" type="submit" formAction={submitOrderViaWhatsApp} disabled={!canOrder || !requestKey}>
              {canOrder ? t("Send order via WhatsApp") : t("Stock must be counted before ordering")} <span aria-hidden="true">â†—</span>
            </button>
            <button className="button button-dark button-full checkout-submit" type="submit" formAction={submitOrder} disabled={!canOrder || !requestKey}>
              {canOrder ? t("Place order on this website") : t("Stock must be counted before ordering")}
            </button>
          </div>
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
              const priceRwf = variant?.priceRwf ?? Math.round(price * exchangeRate.usdToRwf);
              return <div className="checkout-item" key={line.slug + "::" + (line.option ?? "")}><span>{product.name}{line.option ? " Â· " + localizeOption(sourceProduct, line.option, locale) : ""} <b>Ã— {line.quantity}</b></span><PriceDisplay usdAmount={price * line.quantity} rwfAmount={priceRwf * line.quantity} /></div>;
            })}
          </div>
          <div className="summary-row"><span>{t("Subtotal")}</span><PriceDisplay usdAmount={subtotal} rwfAmount={subtotalRwf} /></div>
          <div className="summary-row"><span>{t("Delivery")}</span><span>{t("To be confirmed")}</span></div>
          <div className="summary-total"><span>{t("Estimated total")}</span><PriceDisplay usdAmount={subtotal} rwfAmount={subtotalRwf} /></div>
          <p className="summary-note">{t("Displayed prices remain random placeholders. The shop will confirm the amount before payment.")}</p>
          <Link className="text-link" href="/cart"><span aria-hidden="true">←</span> {t("Back to your bag")}</Link>
        </aside>
      </section>
    </main>
  );
}

