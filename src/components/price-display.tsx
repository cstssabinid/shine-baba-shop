"use client";

import { usePreferences } from "@/components/preferences-provider";
import { formatRwf, formatUsd } from "@/lib/format";

export function PriceDisplay({ usdAmount, rwfAmount, className = "" }: { usdAmount: number; rwfAmount?: number | null; className?: string }) {
  const { exchangeRate } = usePreferences();
  const exactRwf = typeof rwfAmount === "number" ? rwfAmount : null;
  const displayRwf = exactRwf ?? usdAmount * exchangeRate.usdToRwf;
  const displayUsd = exactRwf === null ? usdAmount : exactRwf / exchangeRate.usdToRwf;

  return (
    <span className={`price-display${className ? ` ${className}` : ""}`}>
      <strong>{formatRwf(displayRwf)}</strong>
      <small>{formatUsd(displayUsd)}</small>
    </span>
  );
}
