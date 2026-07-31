import { getTechnicalAnalysis } from "@/lib/analysis/technical-analysis-service";
import type { TechnicalAnalysisResponse } from "@/lib/analysis/types";
import { getFundamentals } from "@/lib/fundamentals-data";
import type { FundamentalsResponse } from "@/lib/fundamentals-data";
import { mockAssets } from "@/lib/mock-data";
import type { Asset } from "@/types/asset";
import type { PerformancePeriod, RankingItem, RankingResponse, RankingType, RankingsBundle } from "./ranking-types";

const defaultLimit = 6;
const cacheTtlMs = 120_000;

// A liquid cross-market set keeps refreshes useful without exhausting free provider quotas.
const rankingCandidateSymbols = [
  "AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL", "TSLA", "AMD", "INTC",
  "JPM", "BAC", "V", "MA", "XOM", "CVX", "UNH", "COST", "SPY", "QQQ",
  "GGAL", "YPFD", "PAMP", "BMA", "BBAR", "SUPV", "LOMA", "CEPU", "TGSU2",
  "BTC-USD", "ETH-USD", "SOL-USD",
] as const;

type LiveRankingSnapshot = {
  asset: Asset;
  technical: TechnicalAnalysisResponse;
  fundamentals: FundamentalsResponse | null;
};

let cachedBundle: { expiresAt: number; value: RankingsBundle } | null = null;
let refreshInFlight: Promise<RankingsBundle> | null = null;
const lastTechnicalBySymbol = new Map<string, TechnicalAnalysisResponse>();
const lastFundamentalsBySymbol = new Map<string, FundamentalsResponse>();

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function assetName(asset: Asset) {
  return asset.nameEs ?? asset.name;
}

function rankingUniverse() {
  const bySymbol = new Map(mockAssets.map((asset) => [asset.symbol.toUpperCase(), asset]));
  return rankingCandidateSymbols.flatMap((symbol) => {
    const asset = bySymbol.get(symbol);
    return asset ? [asset] : [];
  });
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, mapper: (item: T) => Promise<R>) {
  const output = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      output[index] = await mapper(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return output;
}

function supportsFundamentals(asset: Asset) {
  return asset.type === "stock" || asset.type === "argentine_equity" || asset.type === "cedear";
}

async function buildLiveSnapshots() {
  const universe = rankingUniverse();
  const fundamentalAssets = universe.filter(supportsFundamentals);
  const [technicalResults, fundamentalResults] = await Promise.all([
    mapWithConcurrency(universe, 8, async (asset) => ({
      symbol: asset.symbol,
      response: await getTechnicalAnalysis(asset.symbol, "1Y", "es").then((response) => {
        if (usableTechnical(response)) lastTechnicalBySymbol.set(asset.symbol, response);
        return usableTechnical(response) ? response : lastTechnicalBySymbol.get(asset.symbol) ?? response;
      }),
    })),
    mapWithConcurrency(fundamentalAssets, 5, async (asset) => ({
      symbol: asset.symbol,
      response: await getFundamentals({ symbol: asset.symbol }).then((response) => {
        if (usableFundamentals(response)) lastFundamentalsBySymbol.set(asset.symbol, response);
        return usableFundamentals(response) ? response : lastFundamentalsBySymbol.get(asset.symbol) ?? response;
      }),
    })),
  ]);
  const technicalBySymbol = new Map(technicalResults.map((result) => [result.symbol, result.response]));
  const fundamentalsBySymbol = new Map(fundamentalResults.map((result) => [result.symbol, result.response]));

  return universe.map((asset): LiveRankingSnapshot => ({
    asset,
    technical: technicalBySymbol.get(asset.symbol)!,
    fundamentals: fundamentalsBySymbol.get(asset.symbol) ?? null,
  }));
}

function usableTechnical(technical: TechnicalAnalysisResponse) {
  return !technical.isFallback && technical.candlesCount >= 50 && technical.technicalScore > 0;
}

function usableFundamentals(fundamentals: FundamentalsResponse | null) {
  return Boolean(
    fundamentals &&
    !fundamentals.isFallback &&
    typeof fundamentals.fundamentalScore === "number" &&
    fundamentals.fundamentalScore > 0,
  );
}

function technicalReason(technical: TechnicalAnalysisResponse) {
  const parts = [technical.interpretation.label];
  if (technical.snapshot.trendLabel) parts.push(technical.snapshot.trendLabel);
  if (technical.snapshot.rsi14 !== null) parts.push(`RSI ${technical.snapshot.rsi14.toFixed(1)}`);
  return parts.slice(0, 3).join(" · ");
}

function fundamentalReason(fundamentals: FundamentalsResponse) {
  const coverage = typeof fundamentals.coverageRatio === "number"
    ? `${Math.round(fundamentals.coverageRatio * 100)}% de cobertura`
    : "cobertura disponible";
  return `${fundamentals.interpretation.label} · ${coverage}`;
}

function toLiveItem(
  snapshot: LiveRankingSnapshot,
  score: number,
  label: string,
  reason: string,
  sourceLabel: string,
  changePercent = snapshot.technical.dailyChangePercent,
): RankingItem {
  const { asset, technical } = snapshot;
  return {
    symbol: asset.symbol,
    name: assetName(asset),
    assetType: asset.type,
    market: asset.market,
    price: technical.snapshot.lastClose ?? undefined,
    currency: asset.priceDisplayCurrency ?? asset.quoteCurrency ?? asset.currency,
    changePercent: changePercent ?? undefined,
    score: clampScore(score),
    label,
    sourceLabel,
    isFallback: false,
    route: `/asset/${encodeURIComponent(asset.symbol)}`,
    reason,
  };
}

function baseResponse(
  type: RankingType,
  items: RankingItem[],
  generatedAt: string,
  universeSize: number,
  period?: PerformancePeriod,
): RankingResponse {
  return {
    type,
    period,
    generatedAt,
    universeSize,
    items,
    limitations: [
      "Ranking informativo calculado con la cobertura disponible al momento de actualización.",
      "No constituye recomendación de inversión.",
    ],
    sourceSummary: "Análisis técnico y fundamental compartido con las fichas de activos.",
  };
}

function buildBundle(snapshots: LiveRankingSnapshot[]): RankingsBundle {
  const generatedAt = new Date().toISOString();
  const universeSize = snapshots.length;
  const technicalItems = snapshots
    .filter(({ technical }) => usableTechnical(technical))
    .map((snapshot) => toLiveItem(
      snapshot,
      snapshot.technical.technicalScore,
      snapshot.technical.interpretation.label,
      technicalReason(snapshot.technical),
      "Histórico de mercado",
    ))
    .sort((left, right) => right.score - left.score)
    .slice(0, defaultLimit);

  const fundamentalItems = snapshots
    .filter(({ fundamentals }) => usableFundamentals(fundamentals))
    .map((snapshot) => {
      const fundamentals = snapshot.fundamentals!;
      return toLiveItem(
        snapshot,
        fundamentals.fundamentalScore!,
        fundamentals.interpretation.label,
        fundamentalReason(fundamentals),
        "Fundamentos disponibles",
      );
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, defaultLimit);

  const combinedItems = snapshots
    .filter(({ technical, fundamentals }) => usableTechnical(technical) && usableFundamentals(fundamentals))
    .map((snapshot) => {
      const fundamentalScore = snapshot.fundamentals!.fundamentalScore!;
      const coverage = snapshot.fundamentals!.coverageRatio ?? 0.5;
      const score = snapshot.technical.technicalScore * 0.45 + fundamentalScore * 0.45 + coverage * 100 * 0.1;
      return toLiveItem(
        snapshot,
        score,
        "Lectura combinada",
        `Técnico ${snapshot.technical.technicalScore}/100 · Fundamental ${fundamentalScore}/100`,
        "Análisis integrado",
      );
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, defaultLimit);

  const performance = Object.fromEntries((["30D", "180D", "YTD"] as PerformancePeriod[]).map((period) => {
    const items = snapshots
      .filter(({ technical }) => usableTechnical(technical) && typeof technical.periodReturns[period] === "number")
      .map((snapshot) => {
        const periodReturn = snapshot.technical.periodReturns[period]!;
        return toLiveItem(
          snapshot,
          50 + periodReturn,
          period,
          `Rendimiento ${period} calculado con histórico de mercado`,
          "Histórico de mercado",
          periodReturn,
        );
      })
      .sort((left, right) => (right.changePercent ?? 0) - (left.changePercent ?? 0))
      .slice(0, defaultLimit);
    return [period, baseResponse("performance", items, generatedAt, universeSize, period)];
  })) as Record<PerformancePeriod, RankingResponse>;

  return {
    generatedAt,
    universeSize,
    technical: baseResponse("technical", technicalItems, generatedAt, universeSize),
    fundamental: baseResponse("fundamental", fundamentalItems, generatedAt, universeSize),
    combined: baseResponse("combined", combinedItems, generatedAt, universeSize),
    performance,
    limitations: [
      "Las posiciones cambian cuando se actualizan precios, históricos o fundamentos.",
      "No constituyen recomendación de inversión.",
    ],
    sourceSummary: "Rankings dinámicos calculados con los mismos motores de las fichas de activos.",
  };
}

async function refreshRankingsBundle() {
  const snapshots = await buildLiveSnapshots();
  const bundle = buildBundle(snapshots);

  if (!bundle.technical.items.length && cachedBundle?.value.technical.items.length) {
    return cachedBundle.value;
  }

  cachedBundle = { expiresAt: Date.now() + cacheTtlMs, value: bundle };
  return bundle;
}

export async function getRankingsBundle(options: { forceRefresh?: boolean } = {}) {
  if (!options.forceRefresh && cachedBundle && cachedBundle.expiresAt > Date.now()) return cachedBundle.value;
  if (!refreshInFlight) {
    refreshInFlight = refreshRankingsBundle().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function getRankingByType(type: string, period?: string) {
  const bundle = await getRankingsBundle();
  if (type === "technical") return bundle.technical;
  if (type === "fundamental") return bundle.fundamental;
  if (type === "combined") return bundle.combined;
  if (type === "performance") {
    const normalizedPeriod: PerformancePeriod = period === "180D" || period === "YTD" ? period : "30D";
    return bundle.performance[normalizedPeriod];
  }
  return null;
}
