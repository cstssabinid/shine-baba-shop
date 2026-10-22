"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { usePreferences } from "@/components/preferences-provider";

export function CheckoutSuccess({ orderNumber }: { orderNumber: string }) {
  const { clearCart } = useCart();
  const { t } = usePreferences();
  useEffect(() => { clearCart(); }, [clearCart]);

  return <main className="page-main"><section className="container checkout-success empty-state">
    <div className="success-mark">✓</div><p className="eyebrow">{t("Order request received")}</p><h1>{t("Your request is ")}<em>{t("in the shop’s hands.")}</em></h1>
    <p>{t("Order reference")} <strong>{orderNumber}</strong></p>
    <div className="preview-callout">{t("Your order is pending. The shop has reserved the counted stock and will contact you to confirm the total, delivery fee, and payment. No payment was collected online. Displayed prices remain random placeholders until confirmed.")}</div>
    <Link href="/products" className="button button-dark">{t("Continue shopping")} <span>↗</span></Link>
  </section></main>;
}
