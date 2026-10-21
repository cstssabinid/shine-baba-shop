"use client";

import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { usePreferences } from "@/components/preferences-provider";

export function AddToCartButton({
  slug,
  label = "Add to bag",
  className = "",
  option,
}: {
  slug: string;
  label?: string;
  className?: string;
  option?: string;
}) {
  const { addItem } = useCart();
  const { t } = usePreferences();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(slug, option);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <button className={"button button-dark " + className} type="button" onClick={handleAdd}>
      {added ? t("Added to your bag ✓") : label}
    </button>
  );
}
