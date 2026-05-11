import { getAssetClassForMarketData, getYahooSymbol, normalizeSymbol } from "./symbol-map";
import type { MarketDataCandle, MarketDataRequest, MarketDataResponse, MarketDataTimeframe } from "./types";

type YahooChartResult = {
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

export async function getYahooMarketData(request: MarketDataRequest): Promise<MarketDataResponse> {
  const symbol = normalizeSymbol(request.symbol);
  const yahooSymbol = getYahooSymbol(symbol);

  if (!yahooSymbol) return failureResponse(request, "Yahoo provider does not support this symbol in Sprint 5.");

  const timeframe = yahooTimeframes[request.timeframe];
  const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}`);
  url.searchParams.set("range", timeframe.range);
  url.searchParams.set("interval", timeframe.interval);
  url.searchParams.set("includePrePost", "false");

  try {
    // Adaptador MVP sin credenciales. Puede reemplazarse por un proveedor licenciado en una etapa posterior.
    const response = await fetch(url, {
      headers: { "User-Agent": "CMA Market Intelligence market-data MVP" },
      next: { revalidate: 60 },
    });

    if (!response.ok) return failureResponse(request, `Yahoo provider returned HTTP ${response.status}.`);

    const data = (await response.json()) as YahooChartResponse;
    const providerError = data.chart?.error?.description;
    const result = data.chart?.result?.[0];

    if (providerError) return failureResponse(request, providerError);
    if (!result) return failureResponse(request, "Yahoo provider returned no chart result.");

    return {
      symbol,
      provider: "yahoo",
      assetClass: request.assetClass ?? getAssetClassForMarketData(symbol),
      timeframe: request.timeframe,
      candles: normalizeCandles(result),
      isFallback: false,
      sourceLabel: "Yahoo Finance compatible data",
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return failureResponse(request, error instanceof Error ? error.message : "Yahoo provider request failed.");
  }
}
