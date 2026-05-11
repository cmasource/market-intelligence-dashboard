import { generateMockOHLCV } from "@/lib/chart/mock-chart-data";
import { getAssetClassForMarketData, normalizeSymbol } from "./symbol-map";
import type { MarketDataRequest, MarketDataResponse } from "./types";

export function getMockMarketData(request: MarketDataRequest, error?: string): MarketDataResponse {
  const symbol = normalizeSymbol(request.symbol);
  const assetClass = request.assetClass ?? getAssetClassForMarketData(symbol);

  return {
    symbol,
    provider: "mock",
    assetClass,
    timeframe: request.timeframe,
    candles: generateMockOHLCV(symbol, request.timeframe),
    isFallback: true,
    sourceLabel: "Mock OHLCV data",
    ...(error ? { error } : {}),
  };
}
