import { buildFundamentalsInterpretation, calculateFundamentalScore } from "@/lib/fundamentals-data/fundamentals-score";
import { getFundamentalsAssetClass, normalizeFundamentalsSymbol } from "@/lib/fundamentals-data/symbol-map";
import type { FundamentalsRequest, FundamentalsResponse, FundamentalsSnapshot } from "@/lib/fundamentals-data/types";
import { getAssetClassForMarketData, normalizeSymbol } from "@/lib/market-data/symbol-map";
import type { MarketDataCandle, MarketDataRequest, MarketDataResponse } from "@/lib/market-data/types";
import type { NewsArticle } from "@/lib/news/types";
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
type FinnhubNews = Array<{ headline?: string; source?: string; url?: string; datetime?: number; summary?: string; related?: string }>;

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
    marketCap: p?.marketCapitalization ? p.marketCapitalization * 1_000_000 : undefined,
    trailingPE: m.peNormalizedAnnual ?? m.peTTM,
    forwardPE: m.forwardPE,
    priceToBook: m.pbAnnual ?? m.pbQuarterly,
    eps: m.epsNormalizedAnnual ?? m.epsTTM,
    roe: m.roeTTM,
    roa: m.roaTTM,
    grossMargin: m.grossMarginTTM,
    operatingMargin: m.operatingMarginTTM,
    netMargin: m.netProfitMarginTTM,
    dividendYield: m.dividendYieldIndicatedAnnual,
    beta: m.beta,
    fiftyTwoWeekHigh: q?.h ?? m["52WeekHigh"],
    fiftyTwoWeekLow: q?.l ?? m["52WeekLow"],
    currency: p?.currency ?? "USD",
    period: "Finnhub latest",
  };
  const score = calculateFundamentalScore(snapshot);
  const errors = [quote, profile, metrics].filter((item) => !item.ok).map((item) => item.error);
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
    error: Object.values(snapshot).some((value) => value !== undefined && value !== null) ? undefined : errors[0] ?? "Finnhub returned no usable fundamentals.",
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
  return {
    ok: true,
    provider: "finnhub",
    data: result.data.slice(0, 8).map((item) => ({
      title: item.headline ?? "Market update",
      source: item.source ?? "Finnhub",
      url: item.url ?? "#",
      publishedAt: item.datetime ? new Date(item.datetime * 1000).toISOString() : undefined,
      summary: item.summary,
      relatedSymbols: [normalizeSymbol(symbol)],
      provider: "finnhub",
      isFallback: false,
    })),
  };
}
