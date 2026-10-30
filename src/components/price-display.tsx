"use client";

import { usePreferences } from "@/components/preferences-provider";
import { formatRwf, formatUsd } from "@/lib/format";

export function PriceDisplay({ usdAmount, className = "" }: { usdAmount: number; className?: string }) {
  const { exchangeRate } = usePreferences();

  return (
    <span className={`price-display${className ? ` ${className}` : ""}`}>
      <strong>{formatRwf(usdAmount * exchangeRate.usdToRwf)}</strong>
      <small>{formatUsd(usdAmount)}</small>
    </span>
  );
}
