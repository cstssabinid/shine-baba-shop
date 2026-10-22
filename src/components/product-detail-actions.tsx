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
  const selectedLabel = canonicalOptionValues?.[selectedIndex] ?? product.options?.values[selectedIndex] ?? "Default";
  const selectedVariant = product.variants?.find((item) => item.label === selectedLabel) ?? product.variants?.[0];

  function add(continueToCheckout = false) {
    const selectedOption = product.options?.values[selectedIndex] ?? "";
    const option = selectedOption ? canonicalOptionValues?.[selectedIndex] ?? selectedOption : undefined;
    if (!addItem(product.slug, option)) {
      setNotice(t("Stock is not set or this item is out of stock"));
      return;
    }
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
      <p className="product-stock-note">{!selectedVariant || selectedVariant.stockQuantity === null ? t("Stock not set") : selectedVariant.stockQuantity > 0 ? `${selectedVariant.stockQuantity} ${t("available")}` : t("Out of stock")}</p>
      <div className="detail-buttons">
        <button className="button button-dark detail-add" type="button" onClick={() => add(false)}>{t("Add to bag")}</button>
        <button className="button button-orange" type="button" onClick={() => add(true)}>{t("Buy now")} <span>↗</span></button>
      </div>
      <p className="action-live" aria-live="polite">{notice}</p>
    </div>
  );
}
