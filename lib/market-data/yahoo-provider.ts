import { getAssetClassForMarketData, getYahooSymbol, normalizeSymbol } from "./symbol-map";
import type { ProviderTraceEntry } from "@/lib/providers/types";
import type { MarketDataCandle, MarketDataRequest, MarketDataResponse, MarketDataTimeframe, MarketQuoteResponse } from "./types";

type YahooChartResult = {
  meta?: {
    currency?: string;
    regularMarketPrice?: number;
    regularMarketTime?: number;
    exchangeDataDelayedBy?: number;
  };
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      open?: Array<number | null>;
      high?: Array<number | null>;
      low?: Array<number | null>;
      close?: Array<number | null>;
      volume?: Array<number | null>;
    }>;
  };
};

type YahooChartResponse = {
  chart?: {
    result?: YahooChartResult[] | null;
    error?: { description?: string } | null;
  };
};

const yahooTimeframes: Record<MarketDataTimeframe, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "5m" },
  "5D": { range: "5d", interval: "15m" },
  "1M": { range: "1mo", interval: "1d" },
  "6M": { range: "6mo", interval: "1d" },
  YTD: { range: "ytd", interval: "1d" },
  "1Y": { range: "1y", interval: "1d" },
  "5Y": { range: "5y", interval: "1wk" },
};

function failureResponse(request: MarketDataRequest, error: string): MarketDataResponse {
  const symbol = normalizeSymbol(request.symbol);

  return {
    symbol,
    provider: "yahoo",
    assetClass: request.assetClass ?? getAssetClassForMarketData(symbol),
    timeframe: request.timeframe,
    candles: [],
    isFallback: false,
    sourceLabel: "Yahoo Finance compatible data",
    error,
    fetchedAt: new Date().toISOString(),
  };
}

function normalizeCandles(result: YahooChartResult): MarketDataCandle[] {
  const timestamps = result.timestamp ?? [];
  const quote = result.indicators?.quote?.[0];

  if (!quote) return [];

  return timestamps.flatMap((time, index) => {
    const open = quote.open?.[index];
    const high = quote.high?.[index];
    const low = quote.low?.[index];
    const close = quote.close?.[index];
    const volume = quote.volume?.[index] ?? 0;

    if (
      typeof open !== "number" ||
      typeof high !== "number" ||
      typeof low !== "number" ||
      typeof close !== "number" ||
      !Number.isFinite(open) ||
      !Number.isFinite(high) ||
      !Number.isFinite(low) ||
      !Number.isFinite(close)
    ) {
      return [];
    }

    return {
      time,
      open,
      high: Math.max(high, open, close),
      low: Math.min(low, open, close),
      close,
      volume: Number.isFinite(volume) ? volume : 0,
    };
  });
}

async function fetchYahooChartResult(
  yahooSymbol: string,
  options: { range: string; interval: string; revalidate: number },
) {
  const errors: string[] = [];

  for (const host of ["query1.finance.yahoo.com", "query2.finance.yahoo.com"]) {
    const url = new URL(`https://${host}/v8/finance/chart/${encodeURIComponent(yahooSymbol)}`);
    url.searchParams.set("range", options.range);
    url.searchParams.set("interval", options.interval);
    url.searchParams.set("includePrePost", "false");

    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "CMA Markets" },
        next: { revalidate: options.revalidate },
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) {
        errors.push(`${host} HTTP ${response.status}`);
        continue;
      }

      const data = (await response.json()) as YahooChartResponse;
      const providerError = data.chart?.error?.description;
      const result = data.chart?.result?.[0];
      if (providerError) {
        errors.push(providerError);
        continue;
      }
      if (!result) {
        errors.push(`${host} returned no chart result`);
        continue;
      }

      return result;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `${host} request failed`);
    }
  }

  throw new Error(errors.join(" | ") || "Market history is unavailable.");
}

export async function getYahooChartCandles(
  yahooSymbol: string,
  options: { range: string; interval: string; revalidate: number },
) {
  const result = await fetchYahooChartResult(yahooSymbol, options);
  const candles = normalizeCandles(result);
  if (candles.length) return candles;
  throw new Error("Yahoo returned no usable candles.");
}

function yahooQuoteTrace(success: boolean): ProviderTraceEntry {
  return {
    provider: "yahoo",
    attempted: true,
    success,
    endpointName: "chart-quote",
    sourceLabel: "Yahoo Finance compatible quote",
    ...(!success ? { reason: "unknown_error" as const } : {}),
  };
}

export async function getYahooQuoteSnapshot(symbol: string): Promise<MarketQuoteResponse> {
  const normalizedSymbol = normalizeSymbol(symbol);
  const yahooSymbol = getYahooSymbol(normalizedSymbol);
  const fetchedAt = new Date().toISOString();

  if (!yahooSymbol) {
    return {
      symbol: normalizedSymbol,
      price: null,
      change: null,
      changePercent: null,
      currency: "USD",
      provider: "yahoo",
      sourceLabel: "Yahoo Finance compatible quote",
      isFallback: false,
      observedAt: null,
      fetchedAt,
      dataDelay: "unknown",
      error: "Yahoo provider does not support this symbol.",
      providerTrace: [yahooQuoteTrace(false)],
    };
  }

  try {
    const result = await fetchYahooChartResult(yahooSymbol, {
      range: "5d",
      interval: "1d",
      revalidate: 15,
    });
    const candles = normalizeCandles(result);
    const latest = candles.at(-1);
    const previous = candles.at(-2);
    const marketPrice = result.meta?.regularMarketPrice;
    const price = typeof marketPrice === "number" && Number.isFinite(marketPrice) && marketPrice > 0
      ? marketPrice
      : latest?.close ?? null;
    const previousClose = previous?.close ?? null;

    if (price === null || price <= 0 || previousClose === null || previousClose <= 0) {
      throw new Error("Yahoo returned insufficient daily quote data.");
    }

    const change = price - previousClose;
    const observedAt = result.meta?.regularMarketTime
      ? new Date(result.meta.regularMarketTime * 1000).toISOString()
      : latest
        ? new Date(latest.time * 1000).toISOString()
        : null;

    return {
      symbol: normalizedSymbol,
      price,
      change,
      changePercent: (change / previousClose) * 100,
      currency: result.meta?.currency ?? "USD",
      provider: "yahoo",
      sourceLabel: "Yahoo Finance compatible quote",
      isFallback: false,
      observedAt,
      fetchedAt,
      dataDelay: (result.meta?.exchangeDataDelayedBy ?? 0) > 0 ? "delayed" : "realtime",
      providerTrace: [yahooQuoteTrace(true)],
    };
  } catch (error) {
    return {
      symbol: normalizedSymbol,
      price: null,
      change: null,
      changePercent: null,
      currency: "USD",
      provider: "yahoo",
      sourceLabel: "Yahoo Finance compatible quote",
      isFallback: false,
      observedAt: null,
      fetchedAt,
      dataDelay: "unknown",
      error: error instanceof Error ? error.message : "Yahoo quote request failed.",
      providerTrace: [yahooQuoteTrace(false)],
    };
  }
}

export async function getYahooMarketData(request: MarketDataRequest): Promise<MarketDataResponse> {
  const symbol = normalizeSymbol(request.symbol);
  const yahooSymbol = getYahooSymbol(symbol);

  if (!yahooSymbol) return failureResponse(request, "Yahoo provider does not support this symbol in Sprint 5.");

  const timeframe = yahooTimeframes[request.timeframe];
  try {
    const candles = await getYahooChartCandles(yahooSymbol, {
      range: timeframe.range,
      interval: timeframe.interval,
      revalidate: 60,
    });

    return {
      symbol,
      provider: "yahoo",
      assetClass: request.assetClass ?? getAssetClassForMarketData(symbol),
      timeframe: request.timeframe,
      candles,
      isFallback: false,
      sourceLabel: "Yahoo Finance compatible data",
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return failureResponse(request, error instanceof Error ? error.message : "Yahoo provider request failed.");
  }
}
