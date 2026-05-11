export function formatCurrency(value: number, currency = "USD") {
  if (currency.includes("/") || currency.includes("CER")) {
    return `${formatNumber(value)} ${currency}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value > 1000 ? 0 : 2,
  }).format(value);
}

export function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value > 1000 ? 0 : 2,
  }).format(value);
}

export function formatScore(score: number) {
  return `${Math.round(score)}/100`;
}
