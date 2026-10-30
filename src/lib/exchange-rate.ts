export type ExchangeRateSnapshot = {
  usdToRwf: number;
  asOf: string | null;
  source: "BNR" | "fallback";
};

const fallbackRate = 1475;

/** Uses Frankfurter's daily rate sourced from the National Bank of Rwanda. */
export async function getUsdToRwfRate(): Promise<ExchangeRateSnapshot> {
  try {
    const response = await fetch("https://api.frankfurter.dev/v2/rate/USD/RWF?providers=bnrrw", {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!response.ok) return { usdToRwf: fallbackRate, asOf: null, source: "fallback" };

    const value: unknown = await response.json();
    if (!value || typeof value !== "object") return { usdToRwf: fallbackRate, asOf: null, source: "fallback" };

    const result = value as { rate?: unknown; date?: unknown };
    if (typeof result.rate !== "number" || !Number.isFinite(result.rate) || result.rate <= 0) {
      return { usdToRwf: fallbackRate, asOf: null, source: "fallback" };
    }

    return {
      usdToRwf: result.rate,
      asOf: typeof result.date === "string" ? result.date : null,
      source: "BNR",
    };
  } catch {
    return { usdToRwf: fallbackRate, asOf: null, source: "fallback" };
  }
}
