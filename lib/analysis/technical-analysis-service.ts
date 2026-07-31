import {
  calculateEMA,
  calculateMACD,
  calculateRSI,
  calculateSMA,
} from "@/lib/finance/technical";
import { getMarketData } from "@/lib/market-data";
import { normalizeSymbol } from "@/lib/market-data/symbol-map";
import type { MarketDataCandle, MarketDataResponse } from "@/lib/market-data/types";
import { resolveInstrument } from "@/lib/instruments/resolveInstrument";
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

function percentageChange(first: number | undefined, last: number | undefined) {
  if (!Number.isFinite(first) || !Number.isFinite(last) || !first) return null;
  return Number(((((last as number) - (first as number)) / (first as number)) * 100).toFixed(4));
}

function closeAtOrAfter(candles: MarketDataCandle[], timestamp: number) {
  return candles.find((candle) => candle.time >= timestamp)?.close;
}

export function calculatePeriodReturns(candles: MarketDataCandle[]) {
  const sorted = candles
    .filter((candle) => Number.isFinite(candle.time) && Number.isFinite(candle.close) && candle.close > 0)
    .sort((left, right) => left.time - right.time);
  const latest = sorted.at(-1);

  if (!latest) return { "30D": null, "180D": null, YTD: null };

  const secondsPerDay = 86_400;
  const latestDate = new Date(latest.time * 1000);
  const startOfYear = Date.UTC(latestDate.getUTCFullYear(), 0, 1) / 1000;

  return {
    "30D": percentageChange(closeAtOrAfter(sorted, latest.time - 30 * secondsPerDay), latest.close),
    "180D": percentageChange(closeAtOrAfter(sorted, latest.time - 180 * secondsPerDay), latest.close),
    YTD: percentageChange(closeAtOrAfter(sorted, startOfYear), latest.close),
  };
}

function buildWarnings(candlesCount: number, snapshot: TechnicalIndicatorSnapshot, language: "en" | "es") {
  const warnings: string[] = [];
  const warning = (english: string, spanish: string) => language === "es" ? spanish : english;

  if (candlesCount < 20) warnings.push(warning("Not enough candles for SMA 20.", "Historial insuficiente para calcular la SMA 20."));
  if (candlesCount < 50) warnings.push(warning("Not enough candles for SMA 50.", "Historial insuficiente para calcular la SMA 50."));
  if (candlesCount < 200) warnings.push(warning("Not enough candles for SMA 200.", "Historial insuficiente para calcular la SMA 200."));
  if (snapshot.rsi14 === null) warnings.push(warning("RSI 14 is unavailable with the current candle history.", "El historial actual no permite calcular el RSI 14."));
  if (snapshot.macd === null || snapshot.macdSignal === null) warnings.push(warning("MACD is unavailable with the current candle history.", "El historial actual no permite calcular el MACD."));

  return warnings;
}

function analyzeMarketData(
  marketData: MarketDataResponse,
  timeframe: Timeframe,
  extraWarnings: string[] = [],
  language: "en" | "es" = "en",
): TechnicalAnalysisResponse {
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
  const dailyChangePercent = percentageChange(closes.at(-2), closes.at(-1));
  const warnings = [...extraWarnings, ...buildWarnings(marketData.candles.length, snapshot, language)];

  return {
    symbol: marketData.symbol,
    timeframe,
    provider: marketData.provider,
    sourceLabel: marketData.sourceLabel,
    isFallback: marketData.isFallback,
    candlesCount: marketData.candles.length,
    snapshot,
    technicalScore,
    dailyChangePercent,
    periodReturns: calculatePeriodReturns(marketData.candles),
    interpretation: buildTechnicalInterpretation(snapshot, technicalScore, language),
    warnings,
    analysisWarnings: warnings,
    providerTrace: [
      {
        provider: marketData.provider,
        attempted: true,
        success: marketData.candles.length > 0,
        endpointName: "technical-analysis",
        sourceLabel: marketData.sourceLabel,
      },
    ],
  };
}

export function getFallbackTechnicalAnalysis(symbol: string, timeframe: Timeframe, warnings: string[] = [], language: "en" | "es" = "en"): TechnicalAnalysisResponse {
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
    provider: "unavailable",
    sourceLabel: "No verified market history",
    isFallback: true,
    candlesCount: 0,
    snapshot,
    technicalScore: 0,
    dailyChangePercent: null,
    periodReturns: { "30D": null, "180D": null, YTD: null },
    interpretation: buildTechnicalInterpretation(snapshot, 0, language),
    warnings,
    analysisWarnings: warnings,
    providerTrace: [{
      provider: "unavailable",
      attempted: true,
      success: false,
      endpointName: "technical-analysis",
      sourceLabel: "No verified market history",
    }],
  };
}

export function resolveTechnicalAnalysisSymbol(symbol: string) {
  const normalized = normalizeSymbol(symbol);
  return resolveInstrument({ symbol: normalized })?.technicalLayer?.symbol ?? normalized;
}

export async function getTechnicalAnalysis(symbol: string, timeframe: Timeframe, language: "en" | "es" = "en"): Promise<TechnicalAnalysisResponse> {
  const requestedSymbol = normalizeSymbol(symbol);
  const technicalSymbol = resolveTechnicalAnalysisSymbol(requestedSymbol);

  try {
    const marketData = await getMarketData({ symbol: technicalSymbol, timeframe });

    if (!marketData.candles.length) {
      return getFallbackTechnicalAnalysis(requestedSymbol, timeframe, [
        marketData.error ?? `${marketData.provider} returned no candles for technical analysis.`,
      ], language);
    }

    const analysis = analyzeMarketData(marketData, timeframe, marketData.error ? [marketData.error] : [], language);
    return { ...analysis, symbol: requestedSymbol };
  } catch (error) {
    return getFallbackTechnicalAnalysis(requestedSymbol, timeframe, [
      error instanceof Error ? error.message : "Technical analysis failed.",
    ], language);
  }
}
