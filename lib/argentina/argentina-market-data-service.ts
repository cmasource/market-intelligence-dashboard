import { getData912LiveQuote, type Data912Category } from "@/lib/providers/data912-provider";
import { getPpiCurrentQuote, type PpiInstrumentType, type PpiSettlement } from "@/lib/providers/ppi-provider";
import { getArgentinaInstrumentFromRegistry, argentinaInstrumentRegistry } from "./argentina-instrument-registry";
import { getArgentinaLiveQuote } from "./argentina-live-quote";
import { getManualArgentinaQuote } from "./argentina-manual-data";
import { normalizeArgentinaQuote, normalizeArgentinaSymbol } from "./argentina-data-normalizer";
import { getArgentinaSourceStatuses } from "./argentina-source-status";
import type { ArgentinaQuote } from "./types";

function ppiTypeFor(symbol: string): PpiInstrumentType | null {
  const instrument = getArgentinaInstrumentFromRegistry(symbol);
  if (!instrument) return null;
  if (instrument.type === "equity") return "ACCIONES";
  if (instrument.type === "cedear") return "CEDEARS";
  if (instrument.type === "sovereign_bond" || instrument.type === "corporate_bond") return "BONOS";
  if (instrument.type === "treasury_bill" || instrument.type === "lecaps") return "LETRAS";
  return null;
}

function data912CategoryFor(symbol: string): Data912Category | null {
  const instrument = getArgentinaInstrumentFromRegistry(symbol);
  if (!instrument) return null;
  if (instrument.type === "equity") return "arg_stocks";
  if (instrument.type === "cedear") return "arg_cedears";
  if (instrument.type === "sovereign_bond") return "arg_bonds";
  if (instrument.type === "corporate_bond") return "arg_corp";
  if (instrument.type === "treasury_bill" || instrument.type === "lecaps") return "arg_notes";
  return null;
}

async function getPpiArgentinaQuote(symbol: string): Promise<ArgentinaQuote | null> {
  const type = ppiTypeFor(symbol);
  if (!type) return null;

  try {
    const settlements: PpiSettlement[] = ["A-24HS", "INMEDIATA"];
    const quote = (await getPpiCurrentQuote({ ticker: symbol, type, settlement: settlements[0] }))
      ?? (await getPpiCurrentQuote({ ticker: symbol, type, settlement: settlements[1] }));
    if (!quote?.price) return null;

    const previousClose =
      typeof quote.previousClose === "number" && Number.isFinite(quote.previousClose)
        ? quote.previousClose
        : null;
    const change =
      typeof quote.marketChange === "number" && Number.isFinite(quote.marketChange)
        ? quote.marketChange
        : previousClose && previousClose > 0
          ? quote.price - previousClose
          : null;
    const changePercent =
      typeof quote.marketChangePercent === "string"
        ? Number(quote.marketChangePercent.replace("%", "").replace(",", "."))
        : typeof quote.marketChangePercent === "number" && Number.isFinite(quote.marketChangePercent)
          ? quote.marketChangePercent
          : change !== null && previousClose
            ? (change / previousClose) * 100
            : null;

    return normalizeArgentinaQuote({
      symbol,
      price: quote.price,
      currency: getArgentinaInstrumentFromRegistry(symbol)?.quoteCurrency ?? "ARS",
      change,
      changePercent,
      volume: quote.volume,
      open: quote.openingPrice,
      previousClose,
      high: quote.max,
      low: quote.min,
      lastUpdated: quote.date ? new Date(quote.date).toISOString() : new Date().toISOString(),
      source: "ppi",
      sourceLabel: "PPI mercado local",
      isRealData: true,
      isFallback: false,
    });
  } catch {
    return null;
  }
}

async function getData912ArgentinaQuote(symbol: string): Promise<ArgentinaQuote | null> {
  const category = data912CategoryFor(symbol);
  if (!category) return null;

  try {
    const quote = await getData912LiveQuote(category, symbol);
    if (!quote) return null;

    return normalizeArgentinaQuote({
      symbol,
      price: quote.c,
      currency: getArgentinaInstrumentFromRegistry(symbol)?.quoteCurrency ?? "ARS",
      changePercent: quote.pct_change,
      bid: quote.px_bid,
      ask: quote.px_ask,
      volume: quote.v,
      lastUpdated: new Date().toISOString(),
      source: "data912",
      sourceLabel: "Mercado local",
      isRealData: true,
      isFallback: false,
    });
  } catch {
    return null;
  }
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
  const ppiQuote = await getPpiArgentinaQuote(normalized);
  const data912Quote = ppiQuote ? null : await getData912ArgentinaQuote(normalized);
  const liveQuote = ppiQuote ?? data912Quote ?? (await getArgentinaLiveQuote(normalized));
  return liveQuote ?? getManualArgentinaQuote(normalized) ?? unavailableQuote(normalized);
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
