import {
  calculateEMA,
  calculateMACD,
  calculateRSI,
  calculateSMA,
} from "@/lib/finance/technical";
import { getMarketData } from "@/lib/market-data";
import type { Timeframe } from "@/types/chart";
import { calculateRecentResistance, calculateRecentSupport, calculateVolumeTrend } from "./support-resistance";
import {
  buildTechnicalInterpretation,
  calculateTechnicalScore,
  getMomentumLabel,
  getTrendLabel,
} from "./technical-score";
import type { TechnicalAnalysisResponse, TechnicalIndicatorSnapshot } from "./types";

function latestValue(values: Array<number | null>) {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    const value = values[index];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }

  return null;
}

function buildWarnings(candlesCount: number, snapshot: TechnicalIndicatorSnapshot) {
  const warnings: string[] = [];

  if (candlesCount < 20) warnings.push("Not enough candles for SMA 20.");
  if (candlesCount < 50) warnings.push("Not enough candles for SMA 50.");
  if (candlesCount < 200) warnings.push("Not enough candles for SMA 200.");
  if (snapshot.rsi14 === null) warnings.push("RSI 14 is unavailable with the current candle history.");
  if (snapshot.macd === null || snapshot.macdSignal === null) warnings.push("MACD is unavailable with the current candle history.");

  return warnings;
}

export async function getTechnicalAnalysis(symbol: string, timeframe: Timeframe): Promise<TechnicalAnalysisResponse> {
  try {
    const marketData = await getMarketData({ symbol, timeframe });
    const closes = marketData.candles.map((candle) => candle.close).filter(Number.isFinite);
    const volumes = marketData.candles.map((candle) => candle.volume).filter(Number.isFinite);
    const macdResult = calculateMACD(closes);
    const snapshotBase = {
      lastClose: closes.at(-1) ?? null,
      sma20: latestValue(calculateSMA(closes, 20)),
      sma50: latestValue(calculateSMA(closes, 50)),
      sma200: latestValue(calculateSMA(closes, 200)),
      ema12: latestValue(calculateEMA(closes, 12)),
      ema26: latestValue(calculateEMA(closes, 26)),
      rsi14: latestValue(calculateRSI(closes, 14)),
      macd: latestValue(macdResult.macdLine),
      macdSignal: latestValue(macdResult.signalLine),
      macdHistogram: latestValue(macdResult.histogram),
      support: calculateRecentSupport(closes),
      resistance: calculateRecentResistance(closes),
      volumeTrend: calculateVolumeTrend(volumes),
    };
    const trendLabel = getTrendLabel({ ...snapshotBase, trendLabel: "", momentumLabel: "" });
    const momentumLabel = getMomentumLabel({ ...snapshotBase, trendLabel, momentumLabel: "" });
    const snapshot: TechnicalIndicatorSnapshot = {
      ...snapshotBase,
      trendLabel,
      momentumLabel,
      volatilityLabel: marketData.isFallback ? "Fallback data volatility" : "Provider data volatility",
    };
    const technicalScore = calculateTechnicalScore(snapshot);

    return {
      symbol: marketData.symbol,
      timeframe,
      provider: marketData.provider,
      sourceLabel: marketData.sourceLabel,
      isFallback: marketData.isFallback,
      candlesCount: marketData.candles.length,
      snapshot,
      technicalScore,
      interpretation: buildTechnicalInterpretation(snapshot, technicalScore),
      warnings: buildWarnings(marketData.candles.length, snapshot),
    };
  } catch (error) {
    const snapshot: TechnicalIndicatorSnapshot = {
      lastClose: null,
      sma20: null,
      sma50: null,
      sma200: null,
      ema12: null,
      ema26: null,
      rsi14: null,
      macd: null,
      macdSignal: null,
      macdHistogram: null,
      support: null,
      resistance: null,
      volumeTrend: "unavailable",
      trendLabel: "Trend unavailable",
      momentumLabel: "Momentum unavailable",
    };

    return {
      symbol,
      timeframe,
      provider: "mock",
      sourceLabel: "Mock OHLCV data",
      isFallback: true,
      candlesCount: 0,
      snapshot,
      technicalScore: 0,
      interpretation: buildTechnicalInterpretation(snapshot, 0),
      warnings: [error instanceof Error ? error.message : "Technical analysis failed."],
    };
  }
}
