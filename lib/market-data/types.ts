import type { Timeframe } from "@/types/chart";

export type MarketDataProviderName = "mock" | "yahoo" | "crypto" | "fmp" | "finnhub" | "alpha_vantage";

export type MarketDataAssetClass = "stock" | "etf" | "crypto" | "argentina" | "bond" | "unknown";

export type MarketDataTimeframe = Timeframe;

export type MarketDataCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type MarketDataResponse = {
  symbol: string;
  provider: MarketDataProviderName;
  assetClass: MarketDataAssetClass;
  timeframe: MarketDataTimeframe;
  candles: MarketDataCandle[];
  isFallback: boolean;
  sourceLabel: string;
  error?: string;
  fetchedAt?: string;
};

export type MarketDataRequest = {
  symbol: string;
  timeframe: MarketDataTimeframe;
  assetClass?: MarketDataAssetClass;
};
