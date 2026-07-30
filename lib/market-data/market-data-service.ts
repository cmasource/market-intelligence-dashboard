import { getCryptoMarketData } from "./crypto-provider";
import { getAssetClassForMarketData, getCryptoSymbol, getYahooSymbol, normalizeSymbol } from "./symbol-map";
import type { MarketDataRequest, MarketDataResponse } from "./types";
import { getYahooMarketData } from "./yahoo-provider";
import { getAlphaVantageMarketData, getFinnhubCandles, getFmpHistoricalPrices } from "@/lib/providers";

function fallback(request: MarketDataRequest, providerResponse?: MarketDataResponse) {
  const context = providerResponse?.error
    ? `Fallback after ${providerResponse.provider} error: ${providerResponse.error}`
    : providerResponse
      ? `Fallback after ${providerResponse.provider} returned no candles.`
      : undefined;

  return {
    symbol: normalizeSymbol(request.symbol),
    provider: "unavailable" as const,
    assetClass: request.assetClass ?? getAssetClassForMarketData(request.symbol),
    timeframe: request.timeframe,
    candles: [],
    isFallback: true,
    sourceLabel: "No verified OHLCV data",
    ...(context ? { error: context } : {}),
  };
}

export async function getMarketData(request: MarketDataRequest): Promise<MarketDataResponse> {
  const symbol = normalizeSymbol(request.symbol);
  const assetClass = request.assetClass ?? getAssetClassForMarketData(symbol);
  const normalizedRequest = { ...request, symbol, assetClass };

  try {
    if (getYahooSymbol(symbol)) {
      const yahooResponse = await getYahooMarketData(normalizedRequest);
      if (!yahooResponse.error && yahooResponse.candles.length > 0) return yahooResponse;

      const providerAttempts = [
        () => getFmpHistoricalPrices(normalizedRequest),
        () => getFinnhubCandles(normalizedRequest),
        () => getAlphaVantageMarketData(normalizedRequest),
      ];

      for (const attempt of providerAttempts) {
        const response = await attempt();
        if (!response.error && response.candles.length > 0) return response;
      }
    }

    if (getCryptoSymbol(symbol)) {
      const response = await getCryptoMarketData(normalizedRequest);
      return response.candles.length > 0 ? response : fallback(normalizedRequest, response);
    }

    return fallback(normalizedRequest);
  } catch (error) {
    return fallback(
      normalizedRequest,
      {
        symbol,
        provider: "unavailable",
        assetClass,
        timeframe: request.timeframe,
        candles: [],
        isFallback: true,
        sourceLabel: "No verified OHLCV data",
        error: error instanceof Error ? error.message : "Unexpected market-data service error.",
      },
    );
  }
}
