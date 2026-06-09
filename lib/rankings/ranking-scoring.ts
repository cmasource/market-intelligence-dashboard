import { generateMockOHLCV } from "@/lib/chart/mock-chart-data";
import type { Timeframe } from "@/types/chart";
import type { Asset } from "@/types/asset";
import type { PerformancePeriod, RankingItem } from "./ranking-types";

const periodTimeframes: Record<PerformancePeriod, Timeframe> = {
  "30D": "1M",
  "180D": "6M",
  YTD: "YTD",
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function hasNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function dataCoverageScore(asset: Asset) {
  let score = 20;
  if (hasNumber(asset.price)) score += 15;
  if (asset.technical) score += 20;
  if (hasNumber(asset.technicalScore)) score += 15;
  if (asset.fundamentals) score += 15;
  if (hasNumber(asset.fundamentalScore)) score += 10;
  if (asset.bondMetrics || asset.argentinaContext || asset.cryptoContext) score += 5;
  return clampScore(score);
}

function sourceLabel(asset: Asset, area: "technical" | "fundamental" | "combined" | "performance") {
  if (asset.argentinaContext) return "Cobertura local estructurada";
  if (asset.cryptoContext) return area === "fundamental" ? "Fundamentos no aplicables" : "Proveedor/fallback cripto";
  if (asset.type === "stock" || asset.type === "etf") return "Proveedor con fallback";
  if (asset.bondMetrics) return "Renta fija estructurada";
  return "Cobertura disponible";
}

function isFallback(asset: Asset) {
  return Boolean(asset.argentinaContext || asset.cryptoContext || asset.bondMetrics);
}

function assetName(asset: Asset) {
  return asset.nameEs ?? asset.name;
}

export function buildTechnicalReason(asset: Asset) {
  const parts: string[] = [];
  if (asset.technicalScore >= 78) parts.push("lectura técnica más constructiva");
  else if (asset.technicalScore >= 65) parts.push("señal constructiva");
  else if (asset.technicalScore >= 50) parts.push("lectura técnica equilibrada");
  else parts.push("lectura técnica prudente");

  if (asset.technical?.rsi14 >= 65) parts.push("RSI elevado");
  else if (asset.technical?.rsi14 >= 50) parts.push("momentum disponible");

  if (asset.technical?.sma20 > asset.technical?.sma50) parts.push("media corta por encima");
  if (asset.technical?.macd?.toLowerCase().includes("positive")) parts.push("MACD positivo");
  return parts.slice(0, 3).join(" · ");
}

export function buildFundamentalReason(asset: Asset) {
  if (asset.cryptoContext) return "fundamentos tradicionales no aplicables";
  if (!asset.fundamentals) return "datos limitados";

  const parts: string[] = [];
  if (hasNumber(asset.fundamentals.roe) && asset.fundamentals.roe >= 18) parts.push("rentabilidad sólida");
  if (hasNumber(asset.fundamentals.ebitdaMargin) && asset.fundamentals.ebitdaMargin >= 20) parts.push("márgenes disponibles");
  if (hasNumber(asset.fundamentals.peRatio) && asset.fundamentals.peRatio >= 28) parts.push("valuación a revisar");
  if (!hasNumber(asset.fundamentalScore)) parts.push("cobertura parcial");
  return parts.length ? parts.slice(0, 3).join(" · ") : "cobertura parcial";
}

export function buildCombinedReason(asset: Asset, confidence: number) {
  const parts = [
    asset.cryptoContext ? "técnico y momentum con cobertura cripto" : "técnico, fundamentos y cobertura",
    confidence >= 80 ? "datos amplios" : "cobertura parcial",
  ];
  if (asset.bondMetrics) parts[0] = "renta fija con métricas estructuradas";
  return parts.join(" · ");
}

export function scoreTechnical(asset: Asset) {
  const trendBoost = asset.technical?.sma20 > asset.technical?.sma50 ? 4 : 0;
  const momentumBoost = asset.technical?.macd?.toLowerCase().includes("positive") ? 3 : 0;
  const rsiPenalty = asset.technical?.rsi14 > 74 ? -4 : 0;
  return clampScore(asset.technicalScore + trendBoost + momentumBoost + rsiPenalty);
}

export function scoreFundamental(asset: Asset) {
  if (asset.cryptoContext) return null;
  if (hasNumber(asset.fundamentalScore)) return clampScore(asset.fundamentalScore);
  if (!asset.fundamentals) return null;

  const roe = hasNumber(asset.fundamentals.roe) ? Math.min(asset.fundamentals.roe, 35) : 8;
  const margin = hasNumber(asset.fundamentals.ebitdaMargin) ? Math.min(asset.fundamentals.ebitdaMargin, 40) : 10;
  const valuationPenalty = hasNumber(asset.fundamentals.peRatio) ? Math.min(asset.fundamentals.peRatio / 2, 22) : 12;
  return clampScore(45 + roe * 0.7 + margin * 0.45 - valuationPenalty);
}

export function scoreCombined(asset: Asset) {
  const confidence = dataCoverageScore(asset);
  if (asset.cryptoContext) {
    const momentum = hasNumber(asset.dailyChange) ? Math.max(-8, Math.min(8, asset.dailyChange)) : 0;
    return {
      score: clampScore(scoreTechnical(asset) * 0.78 + (50 + momentum * 3) * 0.12 + confidence * 0.1),
      confidence,
    };
  }

  if (asset.bondMetrics && !hasNumber(asset.fundamentalScore)) {
    const fixedIncomeScore = clampScore(55 + (asset.bondMetrics.tir ?? 0) * 0.6 - (asset.bondMetrics.modifiedDuration ?? 0) * 2);
    return {
      score: clampScore(scoreTechnical(asset) * 0.45 + fixedIncomeScore * 0.45 + confidence * 0.1),
      confidence,
    };
  }

  const fundamental = scoreFundamental(asset) ?? 45;
  return {
    score: clampScore(scoreTechnical(asset) * 0.45 + fundamental * 0.45 + confidence * 0.1),
    confidence,
  };
}

export function scorePerformance(asset: Asset, period: PerformancePeriod) {
  const candles = generateMockOHLCV(asset.symbol, periodTimeframes[period]);
  const first = candles.at(0)?.close;
  const last = candles.at(-1)?.close;
  if (!hasNumber(first) || !hasNumber(last) || first === 0) return null;
  return ((last - first) / first) * 100;
}

export function toRankingItem(asset: Asset, score: number, reason: string, label: string, area: "technical" | "fundamental" | "combined" | "performance", changePercent?: number): RankingItem {
  return {
    symbol: asset.symbol,
    name: assetName(asset),
    assetType: asset.type,
    market: asset.market,
    price: asset.price,
    currency: asset.priceDisplayCurrency ?? asset.quoteCurrency ?? asset.currency,
    changePercent,
    score: clampScore(score),
    label,
    sourceLabel: sourceLabel(asset, area),
    isFallback: isFallback(asset),
    route: `/asset/${encodeURIComponent(asset.symbol)}`,
    reason,
  };
}
