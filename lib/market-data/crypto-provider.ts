import { getAssetClassForMarketData, getCryptoSymbol, normalizeSymbol } from "./symbol-map";
import type { MarketDataCandle, MarketDataRequest, MarketDataResponse, MarketDataTimeframe } from "./types";

type CoinbaseCandle = [number, number, number, number, number, number];
type BinanceKline = [number, string, string, string, string, string, number, string, number, string, string, string];
type CoinGeckoChart = {
  prices?: Array<[number, number]>;
  total_volumes?: Array<[number, number]>;
};

const cryptoTimeframes: Record<MarketDataTimeframe, { coinbaseGranularity: number; binanceInterval: string; limit: number; coinGeckoDays: number | "max" }> = {
  "1D": { coinbaseGranularity: 300, binanceInterval: "30m", limit: 288, coinGeckoDays: 1 },
  "5D": { coinbaseGranularity: 3600, binanceInterval: "1h", limit: 120, coinGeckoDays: 5 },
  "1M": { coinbaseGranularity: 21600, binanceInterval: "1d", limit: 120, coinGeckoDays: 30 },
  "6M": { coinbaseGranularity: 86400, binanceInterval: "1d", limit: 180, coinGeckoDays: 180 },
  YTD: { coinbaseGranularity: 86400, binanceInterval: "1d", limit: 300, coinGeckoDays: 365 },
  "1Y": { coinbaseGranularity: 86400, binanceInterval: "1d", limit: 300, coinGeckoDays: 365 },
  "5Y": { coinbaseGranularity: 86400, binanceInterval: "1w", limit: 260, coinGeckoDays: 1825 },
};

const coinGeckoIds: Record<string, string> = {
  "BTC-USD": "bitcoin",
  "ETH-USD": "ethereum",
  "BNB-USD": "binancecoin",
  "SOL-USD": "solana",
  "XRP-USD": "ripple",
  "ADA-USD": "cardano",
  "DOGE-USD": "dogecoin",
  "AVAX-USD": "avalanche-2",
  "LINK-USD": "chainlink",
  "DOT-USD": "polkadot",
  "MATIC-USD": "matic-network",
  "POL-USD": "polygon-ecosystem-token",
  "LTC-USD": "litecoin",
  "BCH-USD": "bitcoin-cash",
};

function failureResponse(request: MarketDataRequest, errors: string[]): MarketDataResponse {
  const symbol = normalizeSymbol(request.symbol);
  return {
    symbol,
    provider: "crypto",
    assetClass: request.assetClass ?? getAssetClassForMarketData(symbol),
    timeframe: request.timeframe,
    candles: [],
    isFallback: false,
    sourceLabel: "Mercado cripto publico",
    error: errors.join(" | "),
    fetchedAt: new Date().toISOString(),
  };
}

function validCandle(candle: MarketDataCandle) {
  return [candle.time, candle.open, candle.high, candle.low, candle.close].every(Number.isFinite) && candle.close > 0;
}

function normalizeCoinbase(data: CoinbaseCandle[]): MarketDataCandle[] {
  return data
    .map(([time, low, high, open, close, volume]) => ({
      time,
      open,
      high: Math.max(high, open, close),
      low: Math.min(low, open, close),
      close,
      volume: Number.isFinite(volume) ? volume : 0,
    }))
    .filter(validCandle)
    .sort((left, right) => left.time - right.time);
}

function normalizeBinance(data: BinanceKline[]): MarketDataCandle[] {
  return data
    .map((item) => ({
      time: Math.floor(item[0] / 1000),
      open: Number(item[1]),
      high: Number(item[2]),
      low: Number(item[3]),
      close: Number(item[4]),
      volume: Number(item[5]),
    }))
    .filter(validCandle)
    .sort((left, right) => left.time - right.time);
}

function normalizeCoinGecko(data: CoinGeckoChart): MarketDataCandle[] {
  const volumes = new Map((data.total_volumes ?? []).map(([time, volume]) => [time, volume]));
  return (data.prices ?? [])
    .map(([time, close], index, prices) => {
      const previousClose = prices[index - 1]?.[1] ?? close;
      return {
        time: Math.floor(time / 1000),
        open: previousClose,
        high: Math.max(previousClose, close),
        low: Math.min(previousClose, close),
        close,
        volume: volumes.get(time) ?? 0,
      };
    })
    .filter(validCandle)
    .sort((left, right) => left.time - right.time);
}

async function fetchCoinbase(symbol: string, timeframe: MarketDataTimeframe) {
  const config = cryptoTimeframes[timeframe];
  const product = symbol;
  const url = new URL(`https://api.exchange.coinbase.com/products/${product}/candles`);
  url.searchParams.set("granularity", String(config.coinbaseGranularity));
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "CMA Markets" },
    next: { revalidate: 60 },
  });
  if (!response.ok) throw new Error(`Coinbase HTTP ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("Coinbase returned an unexpected response");
  const candles = normalizeCoinbase(data as CoinbaseCandle[]);
  if (!candles.length) throw new Error("Coinbase returned no usable candles");
  return candles;
}

async function fetchCoinGecko(symbol: string, timeframe: MarketDataTimeframe) {
  const id = coinGeckoIds[symbol];
  if (!id) throw new Error("CoinGecko does not support this symbol");
  const url = new URL(`https://api.coingecko.com/api/v3/coins/${id}/market_chart`);
  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set("days", String(cryptoTimeframes[timeframe].coinGeckoDays));
  url.searchParams.set("interval", "daily");
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "CMA Markets" },
    next: { revalidate: 120 },
  });
  if (!response.ok) throw new Error(`CoinGecko HTTP ${response.status}`);
  const candles = normalizeCoinGecko((await response.json()) as CoinGeckoChart);
  if (!candles.length) throw new Error("CoinGecko returned no usable candles");
  return candles;
}

async function fetchBinance(symbol: string, timeframe: MarketDataTimeframe) {
  const resolved = getCryptoSymbol(symbol);
  if (!resolved) throw new Error("Binance does not support this symbol");
  const config = cryptoTimeframes[timeframe];
  const url = new URL("https://api.binance.com/api/v3/klines");
  url.searchParams.set("symbol", resolved);
  url.searchParams.set("interval", config.binanceInterval);
  url.searchParams.set("limit", String(config.limit));
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "CMA Markets" },
    next: { revalidate: 60 },
  });
  if (!response.ok) throw new Error(`Binance HTTP ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("Binance returned an unexpected response");
  const candles = normalizeBinance(data as BinanceKline[]);
  if (!candles.length) throw new Error("Binance returned no usable candles");
  return candles;
}

export async function getCryptoMarketData(request: MarketDataRequest): Promise<MarketDataResponse> {
  const symbol = normalizeSymbol(request.symbol);
  if (!getCryptoSymbol(symbol)) return failureResponse(request, ["Unsupported crypto symbol"]);

  const attempts: Array<{ label: string; load: () => Promise<MarketDataCandle[]> }> = request.timeframe === "5Y"
    ? [
        { label: "CoinGecko", load: () => fetchCoinGecko(symbol, request.timeframe) },
        { label: "Coinbase", load: () => fetchCoinbase(symbol, request.timeframe) },
        { label: "Binance", load: () => fetchBinance(symbol, request.timeframe) },
      ]
    : [
        { label: "Coinbase", load: () => fetchCoinbase(symbol, request.timeframe) },
        { label: "CoinGecko", load: () => fetchCoinGecko(symbol, request.timeframe) },
        { label: "Binance", load: () => fetchBinance(symbol, request.timeframe) },
      ];
  const errors: string[] = [];

  for (const attempt of attempts) {
    try {
      const candles = await attempt.load();
      return {
        symbol,
        provider: "crypto",
        assetClass: request.assetClass ?? "crypto",
        timeframe: request.timeframe,
        candles,
        isFallback: false,
        sourceLabel: "Mercado cripto publico",
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      errors.push(`${attempt.label}: ${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  return failureResponse(request, errors);
}
