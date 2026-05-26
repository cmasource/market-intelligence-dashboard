import type { ArgentinaQuote } from "./types";

const validCurrencies = new Set(["ARS", "USD"]);

export function normalizeArgentinaSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

export function normalizeArgentinaCurrency(value: unknown, fallback = "ARS") {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toUpperCase();
  if (validCurrencies.has(normalized)) return normalized;
  return fallback;
}

export function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeArgentinaQuote(input: Partial<ArgentinaQuote> & { symbol: string }): ArgentinaQuote | null {
  const symbol = normalizeArgentinaSymbol(input.symbol);
  const price = toNullableNumber(input.price);
  if (!symbol || price === null || price <= 0) return null;

  return {
    symbol,
    price,
    currency: normalizeArgentinaCurrency(input.currency),
    change: toNullableNumber(input.change),
    changePercent: toNullableNumber(input.changePercent),
    bid: toNullableNumber(input.bid),
    ask: toNullableNumber(input.ask),
    volume: toNullableNumber(input.volume),
    tradedAmount: toNullableNumber(input.tradedAmount),
    open: toNullableNumber(input.open),
    previousClose: toNullableNumber(input.previousClose),
    high: toNullableNumber(input.high),
    low: toNullableNumber(input.low),
    lastUpdated: input.lastUpdated ?? null,
    source: input.source ?? "manual",
    sourceLabel: input.sourceLabel ?? "Carga manual validada",
    isRealData: input.isRealData ?? input.source === "manual",
    isFallback: input.isFallback ?? input.source !== "manual",
  };
}
