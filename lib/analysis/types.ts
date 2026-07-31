import type { MarketDataProviderName, MarketDataTimeframe } from "@/lib/market-data/types";
import type { ProviderTraceEntry } from "@/lib/providers/types";

export type TechnicalAnalysisRequest = {
  symbol: string;
  timeframe: MarketDataTimeframe;
};

export type VolumeTrend = "increasing" | "decreasing" | "neutral" | "unavailable";

export type TechnicalIndicatorSnapshot = {
  lastClose: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  ema12: number | null;
  ema26: number | null;
  rsi14: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  support: number | null;
  resistance: number | null;
  volumeTrend: VolumeTrend;
  trendLabel: string;
  momentumLabel: string;
  volatilityLabel?: string;
};

export type TechnicalInterpretation = {
  label: string;
  tone: "positive" | "neutral" | "negative" | "warning";
  summary: string;
  bulletPoints: string[];
};

export type TechnicalAnalysisResponse = {
  symbol: string;
  timeframe: MarketDataTimeframe;
  provider: MarketDataProviderName;
  sourceLabel: string;
  isFallback: boolean;
  candlesCount: number;
  snapshot: TechnicalIndicatorSnapshot;
  technicalScore: number;
  dailyChangePercent: number | null;
  periodReturns: {
    "30D": number | null;
    "180D": number | null;
    YTD: number | null;
  };
  interpretation: TechnicalInterpretation;
  warnings?: string[];
  analysisWarnings?: string[];
  providerTrace?: ProviderTraceEntry[];
};
