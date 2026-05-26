import { findAsset } from "@/lib/mock-data";
import { getArgentinaInstrumentFromRegistry, argentinaInstrumentRegistry } from "./argentina-instrument-registry";
import { getManualArgentinaQuote } from "./argentina-manual-data";
import { normalizeArgentinaSymbol } from "./argentina-data-normalizer";
import { getArgentinaSourceStatuses } from "./argentina-source-status";
import type { ArgentinaQuote } from "./types";

function structuredMockQuote(symbol: string): ArgentinaQuote | null {
  const asset = findAsset(symbol);
  if (!asset?.argentinaContext && !getArgentinaInstrumentFromRegistry(symbol)) return null;
  const price = asset?.marketDisplayPrice ?? asset?.price ?? null;
  if (typeof price !== "number" || !Number.isFinite(price)) return null;

  return {
    symbol,
    price,
    currency: asset?.quoteCurrency ?? asset?.currency ?? getArgentinaInstrumentFromRegistry(symbol)?.quoteCurrency ?? "ARS",
    change: null,
    changePercent: asset?.dailyChange ?? null,
    bid: null,
    ask: null,
    volume: null,
    tradedAmount: null,
    open: null,
    previousClose: null,
    high: null,
    low: null,
    lastUpdated: null,
    source: "mock",
    sourceLabel: "Dato estructurado simulado",
    isRealData: false,
    isFallback: true,
  };
}

function unavailableQuote(symbol: string): ArgentinaQuote {
  return {
    symbol,
    price: null,
    currency: getArgentinaInstrumentFromRegistry(symbol)?.quoteCurrency ?? "ARS",
    change: null,
    changePercent: null,
    source: "unavailable",
    sourceLabel: "No disponible",
    isRealData: false,
    isFallback: true,
  };
}

export async function getArgentinaQuote(symbol: string) {
  const normalized = normalizeArgentinaSymbol(symbol);
  return getManualArgentinaQuote(normalized) ?? structuredMockQuote(normalized) ?? unavailableQuote(normalized);
}

export async function getArgentinaQuotes(symbols: string[]) {
  const uniqueSymbols = Array.from(new Set(symbols.map(normalizeArgentinaSymbol).filter(Boolean)));
  const entries = await Promise.all(uniqueSymbols.map(async (symbol) => [symbol, await getArgentinaQuote(symbol)] as const));
  return Object.fromEntries(entries);
}

export function getArgentinaInstrument(symbol: string) {
  return getArgentinaInstrumentFromRegistry(symbol);
}

export function getArgentinaInstruments() {
  return argentinaInstrumentRegistry;
}

export function getArgentinaSourceStatus() {
  return getArgentinaSourceStatuses();
}
