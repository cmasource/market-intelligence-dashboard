import { getCurrencySymbol } from "@/lib/formatters";

export function getPricePrecision(price: number) {
  if (!Number.isFinite(price)) return 2;
  if (Math.abs(price) >= 1000) return 0;
  if (Math.abs(price) >= 100) return 1;
  if (Math.abs(price) >= 1) return 2;
  return 4;
}

export function formatChartPrice(value: number, currency?: string) {
  if (!Number.isFinite(value)) return "-";
  const isoCurrency = currency ? getCurrencySymbol(currency) : undefined;

  return new Intl.NumberFormat("en-US", {
    style: isoCurrency ? "currency" : "decimal",
    currency: isoCurrency,
    maximumFractionDigits: getPricePrecision(value),
    minimumFractionDigits: getPricePrecision(value),
  }).format(value);
}

export function formatChartVolume(value: number) {
  if (!Number.isFinite(value)) return "-";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(value);
}
