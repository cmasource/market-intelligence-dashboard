import { getAssetClassForMarketData, getCryptoSymbol, normalizeSymbol } from "./symbol-map";
import type { MarketDataCandle, MarketDataRequest, MarketDataResponse, MarketDataTimeframe } from "./types";

type BinanceKline = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
];

const cryptoTimeframes: Record<MarketDataTimeframe, { interval: string; limit: number }> = {
  "1D": { interval: "30m", limit: 48 },
  "5D": { interval: "1h", limit: 120 },
  "1M": { interval: "1d", limit: 30 },
  "6M": { interval: "1d", limit: 180 },
  YTD: { interval: "1d", limit: 140 },
  "1Y": { interval: "1d", limit: 365 },
  "5Y": { interval: "1w", limit: 260 },
};

function failureResponse(request: MarketDataRequest, error: string): MarketDataResponse {
  const symbol = normalizeSymbol(request.symbol);

  return {
    symbol,
    provider: "crypto",
    assetClass: request.assetClass ?? getAssetClassForMarketData(symbol),
    timeframe: request.timeframe,
    candles: [],
    isFallback: false,
    sourceLabel: "Crypto public market data",
    error,
    fetchedAt: new Date().toISOString(),
  };
}

function normalizeKlines(klines: BinanceKline[]): MarketDataCandle[] {
  return klines.flatMap((kline) => {
    const open = Number(kline[1]);
    const high = Number(kline[2]);
    const low = Number(kline[3]);
    const close = Number(kline[4]);
    const volume = Number(kline[5]);

    if (![open, high, low, close].every(Number.isFinite)) return [];

    return {
      time: Math.floor(kline[0] / 1000),
      open,
      high: Math.max(high, open, close),
      low: Math.min(low, open, close),
      close,
      volume: Number.isFinite(volume) ? volume : 0,
    };
  });
}

export async function getCryptoMarketData(request: MarketDataRequest): Promise<MarketDataResponse> {
  const symbol = normalizeSymbol(request.symbol);
  const cryptoSymbol = getCryptoSymbol(symbol);

  if (!cryptoSymbol) return failureResponse(request, "Crypto provider does not support this symbol in Sprint 5.");

  const timeframe = cryptoTimeframes[request.timeframe];
  const url = new URL("https://api.binance.com/api/v3/klines");
  url.searchParams.set("symbol", cryptoSymbol);
  url.searchParams.set("interval", timeframe.interval);
  url.searchParams.set("limit", String(timeframe.limit));

  try {
    // Adaptador publico MVP sin claves. Puede reemplazarse o ampliarse con exchanges/proveedores licenciados.
    const response = await fetch(url, {
      headers: { "User-Agent": "CMA Market Intelligence market-data MVP" },
      next: { revalidate: 60 },
    });

    if (!response.ok) return failureResponse(request, `Crypto provider returned HTTP ${response.status}.`);

    const data = (await response.json()) as BinanceKline[];

    if (!Array.isArray(data)) return failureResponse(request, "Crypto provider returned an unexpected response.");

    return {
      symbol,
      provider: "crypto",
      assetClass: request.assetClass ?? getAssetClassForMarketData(symbol),
      timeframe: request.timeframe,
      candles: normalizeKlines(data),
      isFallback: false,
      sourceLabel: "Crypto public market data",
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return failureResponse(request, error instanceof Error ? error.message : "Crypto provider request failed.");
  }
}
