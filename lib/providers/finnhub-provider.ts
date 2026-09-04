import { buildFundamentalsInterpretation, calculateFundamentalScore } from "@/lib/fundamentals-data/fundamentals-score";
import { instrumentMasterSeed } from "@/lib/instruments/instrument-master.seed";
import { getFundamentalsAssetClass, normalizeFundamentalsSymbol } from "@/lib/fundamentals-data/symbol-map";
import type { FundamentalsRequest, FundamentalsResponse, FundamentalsSnapshot } from "@/lib/fundamentals-data/types";
import { percentagePointsToRatio } from "@/lib/fundamentals-data/normalization";
import { getAssetClassForMarketData, normalizeSymbol } from "@/lib/market-data/symbol-map";
import type { MarketDataCandle, MarketDataRequest, MarketDataResponse } from "@/lib/market-data/types";
import type { NewsArticle } from "@/lib/news/types";
import { sanitizeNewsText } from "@/lib/news/sanitize-news";
import type { ProviderResult } from "./types";

const baseUrl = "https://finnhub.io/api/v1";

function key() {
  return process.env.FINNHUB_API_KEY?.trim() ?? "";
}

async function fetchFinnhub<T>(path: string, params: Record<string, string> = {}): Promise<ProviderResult<T>> {
  const token = key();
  if (!token) return { ok: false, provider: "finnhub", disabled: true, error: "Missing FINNHUB_API_KEY" };
  const url = new URL(`${baseUrl}${path}`);
  url.searchParams.set("token", token);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);

  try {
    const response = await fetch(url, { next: { revalidate: 120 } });
    if (!response.ok) return { ok: false, provider: "finnhub", error: `Finnhub returned HTTP ${response.status}` };
    return { ok: true, provider: "finnhub", data: await response.json() as T };
  } catch (error) {
    return { ok: false, provider: "finnhub", error: error instanceof Error ? error.message : "Finnhub request failed" };
  }
}

type FinnhubQuote = { c?: number; h?: number; l?: number; pc?: number };
type FinnhubCandles = { s?: string; t?: number[]; o?: number[]; h?: number[]; l?: number[]; c?: number[]; v?: number[] };
type FinnhubProfile = { name?: string; marketCapitalization?: number; currency?: string; shareOutstanding?: number };
type FinnhubMetrics = { metric?: Record<string, number | undefined> };
type FinnhubNews = Array<{ headline?: string; source?: string; url?: string; image?: string; datetime?: number; summary?: string; related?: string }>;

const ignoredNewsTerms = new Set(["inc", "corp", "corporation", "company", "group", "holdings", "limited", "plc", "trust"]);

function companyNewsTerms(symbol: string) {
  const normalized = normalizeSymbol(symbol);
  const instrument = instrumentMasterSeed.find((item) =>
    item.symbol === normalized || item.providerSymbol === normalized || item.underlyingSymbol === normalized,
  );
  const nameTerms = (instrument?.name ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length >= 4 && !ignoredNewsTerms.has(term));
  return Array.from(new Set([normalized.toLowerCase(), ...nameTerms]));
}
export type FinnhubEarningsCalendarItem = {
  date?: string;
  epsActual?: number | null;
  epsEstimate?: number | null;
  hour?: string;
  quarter?: number;
  revenueActual?: number | null;
  revenueEstimate?: number | null;
  symbol?: string;
  year?: number;
};
export type FinnhubEconomicCalendarItem = {
  actual?: number | string | null;
  country?: string;
  estimate?: number | string | null;
  event?: string;
  impact?: string;
  prev?: number | string | null;
  time?: string;
  unit?: string;
};
type FinnhubEarningsCalendar = { earningsCalendar?: FinnhubEarningsCalendarItem[] };
type FinnhubEconomicCalendar = { economicCalendar?: FinnhubEconomicCalendarItem[] };

function hasFundamentalMetric(snapshot: FundamentalsSnapshot) {
  return [
    snapshot.marketPrice,
    snapshot.marketCap,
    snapshot.trailingPE,
    snapshot.forwardPE,
    snapshot.priceToBook,
    snapshot.priceToSales,
    snapshot.eps,
    snapshot.roe,
    snapshot.roa,
    snapshot.grossMargin,
    snapshot.operatingMargin,
    snapshot.netMargin,
    snapshot.dividendYield,
    snapshot.beta,
    snapshot.fiftyTwoWeekHigh,
    snapshot.fiftyTwoWeekLow,
  ].some((value) => value !== undefined && value !== null);
}

export function getFinnhubQuote(symbol: string) {
  return fetchFinnhub<FinnhubQuote>("/quote", { symbol: normalizeSymbol(symbol) });
}

function normalizeCandles(data: FinnhubCandles): MarketDataCandle[] {
  if (data.s && data.s !== "ok") return [];
  return (data.t ?? []).flatMap((time, index) => {
    const close = data.c?.[index];
    if (typeof close !== "number") return [];
    return [{
      time,
      open: data.o?.[index] ?? close,
      high: data.h?.[index] ?? close,
      low: data.l?.[index] ?? close,
      close,
      volume: data.v?.[index] ?? 0,
    }];
  });
}

export async function getFinnhubCandles(request: MarketDataRequest): Promise<MarketDataResponse> {
  const symbol = normalizeSymbol(request.symbol);
  const to = Math.floor(Date.now() / 1000);
  const from = to - 60 * 60 * 24 * 370;
  const result = await fetchFinnhub<FinnhubCandles>("/stock/candle", {
    symbol,
    resolution: request.timeframe === "1D" ? "5" : "D",
    from: String(from),
    to: String(to),
  });

  return {
    symbol,
    provider: "finnhub",
    assetClass: request.assetClass ?? getAssetClassForMarketData(symbol),
    timeframe: request.timeframe,
    candles: result.ok ? normalizeCandles(result.data) : [],
    isFallback: false,
    sourceLabel: "Finnhub provider",
    fetchedAt: new Date().toISOString(),
    ...(!result.ok ? { error: result.error } : {}),
  };
}

export function getFinnhubCompanyProfile(symbol: string) {
  return fetchFinnhub<FinnhubProfile>("/stock/profile2", { symbol: normalizeSymbol(symbol) });
}

export function getFinnhubBasicFinancials(symbol: string) {
  return fetchFinnhub<FinnhubMetrics>("/stock/metric", { symbol: normalizeSymbol(symbol), metric: "all" });
}

export async function getFinnhubFundamentals(request: FundamentalsRequest): Promise<FundamentalsResponse> {
  const symbol = normalizeFundamentalsSymbol(request.symbol);
  const [quote, profile, metrics] = await Promise.all([
    getFinnhubQuote(symbol),
    getFinnhubCompanyProfile(symbol),
    getFinnhubBasicFinancials(symbol),
  ]);
  const q = quote.ok ? quote.data : undefined;
  const p = profile.ok ? profile.data : undefined;
  const m = metrics.ok ? metrics.data.metric ?? {} : {};
  const snapshot: FundamentalsSnapshot = {
    marketPrice: q?.c,
    marketCap: (m.marketCapitalization ?? p?.marketCapitalization)
      ? (m.marketCapitalization ?? p?.marketCapitalization ?? 0) * 1_000_000
      : undefined,
    enterpriseValue: m.enterpriseValue ? m.enterpriseValue * 1_000_000 : undefined,
    trailingPE: m.peNormalizedAnnual ?? m.peTTM,
    forwardPE: m.forwardPE,
    priceToBook: m.pbAnnual ?? m.pbQuarterly ?? m.pb,
    priceToSales: m.psTTM ?? m.psAnnual,
    pegRatio: m.pegTTM ?? m.forwardPEG,
    eps: m.epsNormalizedAnnual ?? m.epsTTM,
    bookValuePerShare: m.bookValuePerShareQuarterly ?? m.bookValuePerShareAnnual,
    roe: percentagePointsToRatio(m.roeTTM),
    roa: percentagePointsToRatio(m.roaTTM),
    grossMargin: percentagePointsToRatio(m.grossMarginTTM),
    operatingMargin: percentagePointsToRatio(m.operatingMarginTTM),
    netMargin: percentagePointsToRatio(m.netProfitMarginTTM),
    revenueGrowth: percentagePointsToRatio(m.revenueGrowthTTMYoy ?? m.revenueGrowthQuarterlyYoy),
    earningsGrowth: percentagePointsToRatio(m.epsGrowthTTMYoy ?? m.epsGrowthQuarterlyYoy),
    debtToEquity: m["totalDebt/totalEquityQuarterly"] ?? m["totalDebt/totalEquityAnnual"],
    currentRatio: m.currentRatioQuarterly ?? m.currentRatioAnnual,
    quickRatio: m.quickRatioQuarterly ?? m.quickRatioAnnual,
    dividendYield: percentagePointsToRatio(m.dividendYieldIndicatedAnnual ?? m.currentDividendYieldTTM),
    beta: m.beta,
    fiftyTwoWeekHigh: m["52WeekHigh"],
    fiftyTwoWeekLow: m["52WeekLow"],
    currency: p?.currency ?? "USD",
    period: "Finnhub latest",
  };
  const score = calculateFundamentalScore(snapshot);
  const errors = [quote, profile, metrics].filter((item) => !item.ok).map((item) => item.error);
  const hasUsableMetric = hasFundamentalMetric(snapshot);
  return {
    symbol,
    provider: "finnhub",
    assetClass: request.assetClass ?? getFundamentalsAssetClass(symbol),
    sourceLabel: "Finnhub provider",
    isFallback: false,
    fetchedAt: new Date().toISOString(),
    snapshot,
    fundamentalScore: score,
    interpretation: buildFundamentalsInterpretation(snapshot, score),
    warnings: errors.length ? errors : undefined,
    error: hasUsableMetric ? undefined : errors[0] ?? "Finnhub returned no usable fundamentals.",
  };
}

export async function getFinnhubCompanyNews(symbol: string): Promise<ProviderResult<NewsArticle[]>> {
  const to = new Date();
  const from = new Date(to.getTime() - 1000 * 60 * 60 * 24 * 14);
  const result = await fetchFinnhub<FinnhubNews>("/company-news", {
    symbol: normalizeSymbol(symbol),
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  });
  if (!result.ok) return result;
  const terms = companyNewsTerms(symbol);
  const relevantItems = result.data.filter((item) => {
    const searchable = `${item.headline ?? ""} ${item.summary ?? ""}`.toLowerCase();
    return terms.some((term) => searchable.includes(term));
  });
  return {
    ok: true,
    provider: "finnhub",
    data: relevantItems.slice(0, 8).map((item) => ({
      title: sanitizeNewsText(item.headline, 180) || "Market update",
      source: sanitizeNewsText(item.source, 80) || "Finnhub",
      url: item.url ?? "#",
      imageUrl: item.image,
      publishedAt: item.datetime ? new Date(item.datetime * 1000).toISOString() : undefined,
      summary: sanitizeNewsText(item.summary, 240),
      relatedSymbols: [normalizeSymbol(symbol)],
      provider: "finnhub",
      isFallback: false,
    })),
  };
}

export async function getFinnhubEarningsCalendar(params: { from: string; to: string; symbol?: string }) {
  return fetchFinnhub<FinnhubEarningsCalendar>("/calendar/earnings", {
    from: params.from,
    to: params.to,
    ...(params.symbol ? { symbol: normalizeSymbol(params.symbol) } : {}),
  });
}

export async function getFinnhubEconomicCalendar(params: { from: string; to: string }) {
  return fetchFinnhub<FinnhubEconomicCalendar>("/calendar/economic", {
    from: params.from,
    to: params.to,
  });
}
