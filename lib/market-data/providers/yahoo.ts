import { getYahooChartCandles } from "@/lib/market-data/yahoo-provider";
import { getYahooSymbol } from "@/lib/market-data/symbol-map";
import {
  normalizeBars,
  normalizeProviderSymbol,
  ProviderError,
  type MarketDataProvider,
  type OhlcvBar,
  type ProviderRequest,
  type ProviderResponse,
} from "./base";

function aggregateFourHour(hourlyBars: OhlcvBar[]) {
  const buckets = new Map<number, OhlcvBar[]>();

  for (const bar of hourlyBars) {
    const date = new Date(bar.time);
    date.setUTCMinutes(0, 0, 0);
    date.setUTCHours(Math.floor(date.getUTCHours() / 4) * 4);
    const key = date.getTime();
    buckets.set(key, [...(buckets.get(key) ?? []), bar]);
  }

  return normalizeBars(Array.from(buckets.entries()).map(([time, bars]) => ({
    time: new Date(time).toISOString(),
    open: bars[0].open,
    high: Math.max(...bars.map((bar) => bar.high)),
    low: Math.min(...bars.map((bar) => bar.low)),
    close: bars.at(-1)?.close ?? bars[0].close,
    volume: bars.reduce((total, bar) => total + bar.volume, 0),
  })));
}

export const yahooRadarProvider: MarketDataProvider = {
  name: "yahoo",
  async getOhlcv(request: ProviderRequest): Promise<ProviderResponse> {
    const requestedSymbol = normalizeProviderSymbol(request.symbol);
    const symbol = getYahooSymbol(requestedSymbol);
    if (!symbol) throw new ProviderError("yahoo", "No public market history is mapped for this symbol.");

    try {
      const intraday = request.interval !== "1d";
      const candles = await getYahooChartCandles(symbol, {
        range: intraday ? "6mo" : "1y",
        interval: intraday ? "1h" : "1d",
        revalidate: intraday ? 120 : 300,
      });
      const rawBars = normalizeBars(candles.map((candle) => ({
        time: new Date(candle.time * 1000).toISOString(),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
      })));
      const ohlcv = (request.interval === "4h" ? aggregateFourHour(rawBars) : rawBars).slice(-260);
      if (!ohlcv.length) throw new ProviderError("yahoo", "Public market history returned no usable OHLCV bars.");

      return {
        symbol: requestedSymbol,
        resolvedSymbol: symbol,
        market: request.market,
        provider: "yahoo",
        interval: request.interval,
        currency: symbol.endsWith(".BA") ? "ARS" : "USD",
        dataDelay: request.interval === "1d" ? "eod" : "delayed",
        ohlcv,
        sourceLabel: "Public market history",
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      throw new ProviderError("yahoo", error instanceof Error ? error.message : "Public market history request failed.");
    }
  },
};
