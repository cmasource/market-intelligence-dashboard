import type { Timeframe } from "@/types/chart";
import type { ProviderTraceEntry } from "@/lib/providers/types";

export type MarketDataProviderName = "unavailable" | "mock" | "yahoo" | "crypto" | "fmp" | "finnhub" | "alpha_vantage";

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

export type MarketQuoteResponse = {
  symbol: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string;
  provider: MarketDataProviderName;
  sourceLabel: string;
  isFallback: boolean;
  fetchedAt: string;
  error?: string;
  providerTrace?: ProviderTraceEntry[];
};
