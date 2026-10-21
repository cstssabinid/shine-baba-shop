"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/catalog";
import { useCart } from "@/components/cart-provider";
import { usePreferences } from "@/components/preferences-provider";

export function ProductDetailActions({ product, canonicalOptionValues }: { product: Product; canonicalOptionValues?: string[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [notice, setNotice] = useState("");
  const { addItem } = useCart();
  const { t } = usePreferences();
  const router = useRouter();

  function add(continueToCheckout = false) {
    const selectedOption = product.options?.values[selectedIndex] ?? "";
    addItem(product.slug, selectedOption ? canonicalOptionValues?.[selectedIndex] ?? selectedOption : undefined);
    setNotice(t("Added to your bag"));
    if (continueToCheckout) router.push("/checkout");
    window.setTimeout(() => setNotice(""), 2200);
  }

  return (
    <div className="detail-actions">
      {product.options && (
        <fieldset className="variant-picker">
          <legend>{product.options.label}</legend>
          <div className="variant-options">
            {product.options.values.map((value, index) => (
              <button
                key={value}
                className={selectedIndex === index ? "variant-option selected" : "variant-option"}
                type="button"
                aria-pressed={selectedIndex === index}
                onClick={() => setSelectedIndex(index)}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      <div className="detail-buttons">
        <button className="button button-dark detail-add" type="button" onClick={() => add(false)}>{t("Add to bag")}</button>
        <button className="button button-orange" type="button" onClick={() => add(true)}>{t("Buy now")} <span>↗</span></button>
      </div>
      <p className="action-live" aria-live="polite">{notice}</p>
    </div>
  );
}
