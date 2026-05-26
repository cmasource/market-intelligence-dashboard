import manualRows from "@/data/argentina-quotes.manual.json";
import { normalizeArgentinaQuote, normalizeArgentinaSymbol, toNullableNumber } from "./argentina-data-normalizer";
import type { ArgentinaQuote } from "./types";

type ManualQuoteRow = Record<string, unknown> & {
  symbol?: unknown;
  price?: unknown;
  currency?: unknown;
};

export function parseArgentinaQuoteRow(row: ManualQuoteRow): ArgentinaQuote | null {
  if (typeof row.symbol !== "string") return null;
  return normalizeArgentinaManualQuote({
    symbol: row.symbol,
    price: toNullableNumber(row.price),
    currency: typeof row.currency === "string" ? row.currency : "ARS",
    change: toNullableNumber(row.change),
    changePercent: toNullableNumber(row.changePercent),
    bid: toNullableNumber(row.bid),
    ask: toNullableNumber(row.ask),
    volume: toNullableNumber(row.volume),
    tradedAmount: toNullableNumber(row.tradedAmount),
    open: toNullableNumber(row.open),
    previousClose: toNullableNumber(row.previousClose),
    high: toNullableNumber(row.high),
    low: toNullableNumber(row.low),
    lastUpdated: typeof row.lastUpdated === "string" ? row.lastUpdated : null,
    sourceLabel: typeof row.sourceLabel === "string" ? row.sourceLabel : "Carga manual validada",
    source: "manual",
    isRealData: true,
    isFallback: false,
  });
}

export function normalizeArgentinaManualQuote(input: Partial<ArgentinaQuote> & { symbol: string }) {
  return normalizeArgentinaQuote({
    ...input,
    source: "manual",
    sourceLabel: input.sourceLabel ?? "Carga manual validada",
    isRealData: true,
    isFallback: false,
  });
}

export function getAllManualArgentinaQuotes() {
  try {
    if (!Array.isArray(manualRows)) return [];
    return manualRows
      .map((row) => parseArgentinaQuoteRow(row as ManualQuoteRow))
      .filter((quote): quote is ArgentinaQuote => Boolean(quote));
  } catch {
    return [];
  }
}

export function getManualArgentinaQuote(symbol: string) {
  const normalized = normalizeArgentinaSymbol(symbol);
  return getAllManualArgentinaQuotes().find((quote) => quote.symbol === normalized) ?? null;
}
