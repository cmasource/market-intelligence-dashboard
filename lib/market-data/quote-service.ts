import { findAsset } from "@/lib/mock-data";
import { resolveInstrument } from "@/lib/instruments/resolveInstrument";
import { getAlphaVantageQuoteSnapshot, getFmpQuoteSnapshot } from "@/lib/providers";
import type { ProviderTraceEntry } from "@/lib/providers/types";
import { getMarketData } from "./market-data-service";
import { getAssetClassForMarketData, getYahooSymbol, normalizeSymbol } from "./symbol-map";
import type { MarketDataCandle, MarketQuoteResponse } from "./types";

function latestQuoteFromCandles(candles: MarketDataCandle[]) {
  const last = candles.at(-1);
  const previous = candles.at(-2);

  if (!last || typeof last.close !== "number" || !Number.isFinite(last.close) || last.close <= 0) {
    return null;
  }

  const change =
    previous && Number.isFinite(previous.close) && previous.close > 0 ? last.close - previous.close : null;
  const changePercent = change !== null && previous ? (change / previous.close) * 100 : null;

  return {
    price: last.close,
    change,
    changePercent,
  };
}

type MarketQuoteOptions = {
  instrumentId?: string;
};

export function resolveMarketQuoteCurrency(symbol: string, instrumentId?: string) {
  const normalizedSymbol = normalizeSymbol(symbol);
  const instrument = resolveInstrument({ symbol: normalizedSymbol, instrumentId })?.instrument;
  const asset = findAsset(normalizedSymbol);

  return instrument?.currency ?? asset?.quoteCurrency ?? asset?.currency ?? "USD";
}

function unavailableQuote(
  symbol: string,
  error?: string,
  providerTrace: ProviderTraceEntry[] = [],
  instrumentId?: string,
): MarketQuoteResponse {
  const normalizedSymbol = normalizeSymbol(symbol);

  return {
    symbol: normalizedSymbol,
    price: null,
    change: null,
    changePercent: null,
    currency: resolveMarketQuoteCurrency(normalizedSymbol, instrumentId),
    provider: "unavailable",
    sourceLabel: "No verified quote",
    isFallback: true,
    observedAt: null,
    fetchedAt: new Date().toISOString(),
    dataDelay: "unknown",
    ...(error ? { error } : {}),
    providerTrace: [
      ...providerTrace,
      {
        provider: "unavailable",
        attempted: true,
        success: false,
        endpointName: "quote",
        sourceLabel: "No verified quote",
      },
    ],
  };
}

export async function getMarketQuote(symbol: string, options: MarketQuoteOptions = {}): Promise<MarketQuoteResponse> {
  const normalizedSymbol = normalizeSymbol(symbol);
  const errors: string[] = [];
  const providerTrace: ProviderTraceEntry[] = [];

  if (!normalizedSymbol) {
    return {
      symbol: normalizedSymbol,
      price: null,
      change: null,
      changePercent: null,
      currency: "USD",
      provider: "unavailable",
      sourceLabel: "No verified quote",
      isFallback: true,
      observedAt: null,
      fetchedAt: new Date().toISOString(),
      dataDelay: "unknown",
      error: "Symbol is required.",
    };
  }

  try {
    if (getYahooSymbol(normalizedSymbol)) {
      const fmpQuote = await getFmpQuoteSnapshot(normalizedSymbol);
      if (fmpQuote.providerTrace) providerTrace.push(...fmpQuote.providerTrace);
      if (!fmpQuote.error && typeof fmpQuote.price === "number" && fmpQuote.price > 0) {
        return { ...fmpQuote, providerTrace };
      }
      if (fmpQuote.error) errors.push(fmpQuote.error);

      const alphaQuote = await getAlphaVantageQuoteSnapshot(normalizedSymbol);
      if (alphaQuote.providerTrace) providerTrace.push(...alphaQuote.providerTrace);
      if (!alphaQuote.error && typeof alphaQuote.price === "number" && alphaQuote.price > 0) {
        return { ...alphaQuote, providerTrace };
      }
      if (alphaQuote.error) errors.push(alphaQuote.error);
    }

    const marketData = await getMarketData({
      symbol: normalizedSymbol,
      timeframe: "1D",
      assetClass: getAssetClassForMarketData(normalizedSymbol),
    });
    const candleQuote = latestQuoteFromCandles(marketData.candles);

    if (candleQuote) {
      providerTrace.push({
        provider: marketData.provider,
        attempted: true,
        success: true,
        endpointName: "market-data",
        sourceLabel: marketData.sourceLabel,
      });

      return {
        symbol: normalizedSymbol,
        price: candleQuote.price,
        change: candleQuote.change,
        changePercent: candleQuote.changePercent,
        currency: resolveMarketQuoteCurrency(normalizedSymbol, options.instrumentId),
        provider: marketData.provider,
        sourceLabel: marketData.sourceLabel,
        isFallback: marketData.isFallback,
        observedAt: marketData.candles.at(-1) ? new Date(marketData.candles.at(-1)!.time * 1000).toISOString() : null,
        fetchedAt: marketData.fetchedAt ?? new Date().toISOString(),
        dataDelay: marketData.assetClass === "crypto" ? "realtime" : marketData.timeframe === "1D" ? "delayed" : "eod",
        ...(marketData.error ? { error: marketData.error } : {}),
        providerTrace,
      };
    }

    if (marketData.error) {
      errors.push(marketData.error);
      providerTrace.push({
        provider: marketData.provider,
        attempted: true,
        success: false,
        reason: "unknown_error",
        endpointName: "market-data",
        sourceLabel: marketData.sourceLabel,
      });
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Quote provider chain failed.");
  }

  return unavailableQuote(
    normalizedSymbol,
    errors.filter(Boolean).join(" | ") || undefined,
    providerTrace,
    options.instrumentId,
  );
}
