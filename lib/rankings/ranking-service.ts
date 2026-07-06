import { instrumentUniverse } from "@/lib/instrument-universe";
import { getAnalysisCoverage } from "@/lib/analysis/analysis-coverage";
import { mockAssets } from "@/lib/mock-data";
import type { Asset } from "@/types/asset";
import {
  buildCombinedReason,
  buildFundamentalReason,
  buildTechnicalReason,
  scoreCombined,
  scoreFundamental,
  scorePerformance,
  scoreTechnical,
  toRankingItem,
} from "./ranking-scoring";
import type { PerformancePeriod, RankingResponse, RankingType, RankingsBundle } from "./ranking-types";

const generatedAt = "2026-06-09T00:00:00.000Z";
const defaultLimit = 6;

function uniqueRankingUniverse() {
  const bySymbol = new Map<string, Asset>();
  for (const asset of mockAssets) bySymbol.set(asset.symbol.toUpperCase(), asset);

  // The instrument universe broadens scope for coverage accounting while ranked rows stay limited to instruments with usable scoring data.
  for (const instrument of instrumentUniverse) {
    const symbol = instrument.symbol.toUpperCase();
    if (!bySymbol.has(symbol)) continue;
  }

  return [...bySymbol.values()];
}

function baseResponse(type: RankingType, items: RankingResponse["items"], period?: PerformancePeriod): RankingResponse {
  const universe = uniqueRankingUniverse();
  return {
    type,
    period,
    generatedAt,
    universeSize: universe.length,
    items,
    limitations: [
      "Ranking informativo basado en datos disponibles, proveedor, fallback estructurado y cobertura futura.",
      "No constituye recomendacion de inversion.",
    ],
    sourceSummary: "Universo interno, datos de proveedor cuando estan disponibles y fallback estructurado sin exponer claves.",
  };
}

export function getTechnicalRanking(limit = defaultLimit) {
  const items = uniqueRankingUniverse()
    .filter((asset) => typeof asset.technicalScore === "number" && getAnalysisCoverage(asset.symbol).technical.status !== "unavailable")
    .map((asset) => toRankingItem(asset, scoreTechnical(asset), buildTechnicalReason(asset), "Lectura informativa", "technical", asset.dailyChange))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return baseResponse("technical", items);
}

export function getFundamentalRanking(limit = defaultLimit) {
  const items = uniqueRankingUniverse()
    .map((asset) => {
      const score = scoreFundamental(asset);
      const coverage = getAnalysisCoverage(asset.symbol);
      if (!["provider", "fallback", "manual", "mock"].includes(coverage.fundamentals.status)) return null;
      if (score === null) return null;
      return toRankingItem(asset, score, buildFundamentalReason(asset), "Calidad fundamental estimada", "fundamental", asset.dailyChange);
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return baseResponse("fundamental", items);
}

export function getCombinedRanking(limit = defaultLimit) {
  const items = uniqueRankingUniverse()
    .map((asset) => {
      const result = scoreCombined(asset);
      const coverage = getAnalysisCoverage(asset.symbol);
      const hasRelevantSecondPillar =
        ["provider", "fallback", "manual", "mock"].includes(coverage.fundamentals.status) ||
        ["provider", "fallback", "manual", "mock"].includes(coverage.fixedIncome.status);
      if (coverage.technical.status === "unavailable" || !hasRelevantSecondPillar) return null;
      return toRankingItem(asset, result.score, buildCombinedReason(asset, result.confidence), "Ranking combinado", "combined", asset.dailyChange);
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return baseResponse("combined", items);
}

export function getPerformanceRanking(period: PerformancePeriod = "30D", limit = defaultLimit) {
  const items = uniqueRankingUniverse()
    .map((asset) => {
      const performance = scorePerformance(asset, period);
      if (performance === null) return null;
      return toRankingItem(
        asset,
        Math.max(0, Math.min(100, 50 + performance)),
        `rendimiento estimado ${period} con serie disponible`,
        period,
        "performance",
        performance,
      );
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0))
    .slice(0, limit);

  return baseResponse("performance", items, period);
}

export function getRankingsBundle(): RankingsBundle {
  const universe = uniqueRankingUniverse();
  const limitations = [
    "Los rankings son lecturas informativas generadas con cobertura disponible.",
    "No constituyen recomendacion de inversion ni sustituyen analisis profesional.",
    "Finviz se considera inspiracion conceptual de producto, no fuente de datos.",
  ];

  return {
    generatedAt,
    universeSize: universe.length,
    technical: getTechnicalRanking(),
    fundamental: getFundamentalRanking(),
    combined: getCombinedRanking(),
    performance: {
      "30D": getPerformanceRanking("30D"),
      "180D": getPerformanceRanking("180D"),
      YTD: getPerformanceRanking("YTD"),
    },
    limitations,
    sourceSummary: "Rankings creados desde mockAssets, instrument universe y series OHLCV de proveedor/fallback disponibles.",
  };
}

export function getRankingByType(type: string, period?: string) {
  if (type === "technical") return getTechnicalRanking();
  if (type === "fundamental") return getFundamentalRanking();
  if (type === "combined") return getCombinedRanking();
  if (type === "performance") {
    const normalizedPeriod = period === "180D" || period === "YTD" ? period : "30D";
    return getPerformanceRanking(normalizedPeriod);
  }
  return null;
}
