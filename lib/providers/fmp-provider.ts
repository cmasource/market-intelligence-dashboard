import { buildFundamentalsInterpretation, calculateFundamentalScore } from "@/lib/fundamentals-data/fundamentals-score";
import { getFundamentalsAssetClass, normalizeFundamentalsSymbol } from "@/lib/fundamentals-data/symbol-map";
import type { FundamentalsRequest, FundamentalsResponse, FundamentalsSnapshot } from "@/lib/fundamentals-data/types";
import { getAssetClassForMarketData, normalizeSymbol } from "@/lib/market-data/symbol-map";
import type { MarketDataCandle, MarketDataRequest, MarketDataResponse } from "@/lib/market-data/types";
import type { NewsArticle } from "@/lib/news/types";
import type { ProviderResult } from "./types";

const baseUrl = "https://financialmodelingprep.com/api/v3";

function apiKey() {
  return process.env.FMP_API_KEY?.trim() ?? "";
}

function disabled<T>(provider: "fmp" = "fmp"): ProviderResult<T> {
  return { ok: false, provider, disabled: true, error: "Missing FMP_API_KEY" };
}

async function fetchFmp<T>(path: string, params: Record<string, string> = {}): Promise<ProviderResult<T>> {
  const key = apiKey();
  if (!key) return disabled();

  const url = new URL(`${baseUrl}${path}`);
  url.searchParams.set("apikey", key);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);

  try {
    const response = await fetch(url, { next: { revalidate: 120 } });
    if (!response.ok) return { ok: false, provider: "fmp", error: `FMP returned HTTP ${response.status}` };
    return { ok: true, provider: "fmp", data: await response.json() as T };
  } catch (error) {
    return { ok: false, provider: "fmp", error: error instanceof Error ? error.message : "FMP request failed" };
  }
}

type FmpHistorical = { historical?: Array<{ date?: string; open?: number; high?: number; low?: number; close?: number; volume?: number }> };
type FmpQuote = Array<{ price?: number; marketCap?: number; pe?: number; eps?: number; sharesOutstanding?: number; yearHigh?: number; yearLow?: number }>;
type FmpProfile = Array<{ companyName?: string; beta?: number; mktCap?: number; price?: number; volAvg?: number; currency?: string }>;
type FmpRatios = Array<{
  priceEarningsRatioTTM?: number;
  priceToBookRatioTTM?: number;
  priceToSalesRatioTTM?: number;
  returnOnEquityTTM?: number;
  returnOnAssetsTTM?: number;
  grossProfitMarginTTM?: number;
  operatingProfitMarginTTM?: number;
  netProfitMarginTTM?: number;
  dividendYielTTM?: number;
  dividendYieldTTM?: number;
}>;
type FmpNews = Array<{ title?: string; site?: string; url?: string; publishedDate?: string; text?: string; symbol?: string }>;

function normalizeFmpCandles(data: FmpHistorical): MarketDataCandle[] {
  return (data.historical ?? [])
    .flatMap((item) => {
      if (!item.date || typeof item.close !== "number") return [];
      const time = Math.floor(new Date(item.date).getTime() / 1000);
      if (!Number.isFinite(time)) return [];
      const open = item.open ?? item.close;
      const high = item.high ?? Math.max(open, item.close);
      const low = item.low ?? Math.min(open, item.close);
      return [{ time, open, high, low, close: item.close, volume: item.volume ?? 0 }];
    })
    .reverse();
}

export async function getFmpHistoricalPrices(request: MarketDataRequest): Promise<MarketDataResponse> {
  const symbol = normalizeSymbol(request.symbol);
  const result = await fetchFmp<FmpHistorical>(`/historical-price-full/${encodeURIComponent(symbol)}`, { timeseries: "260" });
  if (!result.ok) {
    return {
      symbol,
      provider: "fmp",
      assetClass: request.assetClass ?? getAssetClassForMarketData(symbol),
      timeframe: request.timeframe,
      candles: [],
      isFallback: false,
      sourceLabel: "FMP provider",
      error: result.error,
      fetchedAt: new Date().toISOString(),
    };
  }

  return {
    symbol,
    provider: "fmp",
    assetClass: request.assetClass ?? getAssetClassForMarketData(symbol),
    timeframe: request.timeframe,
    candles: normalizeFmpCandles(result.data),
    isFallback: false,
    sourceLabel: "FMP provider",
    fetchedAt: new Date().toISOString(),
  };
}

export async function getFmpQuote(symbol: string) {
  return fetchFmp<FmpQuote>(`/quote/${encodeURIComponent(normalizeSymbol(symbol))}`);
}

export async function getFmpCompanyProfile(symbol: string) {
  return fetchFmp<FmpProfile>(`/profile/${encodeURIComponent(normalizeSymbol(symbol))}`);
}

export async function getFmpFundamentals(request: FundamentalsRequest): Promise<FundamentalsResponse> {
  const symbol = normalizeFundamentalsSymbol(request.symbol);
  const [quote, profile, ratios] = await Promise.all([
    getFmpQuote(symbol),
    getFmpCompanyProfile(symbol),
    fetchFmp<FmpRatios>(`/ratios-ttm/${encodeURIComponent(symbol)}`),
  ]);

  const quoteData = quote.ok ? quote.data[0] : undefined;
  const profileData = profile.ok ? profile.data[0] : undefined;
  const ratioData = ratios.ok ? ratios.data[0] : undefined;
  const snapshot: FundamentalsSnapshot = {
    marketPrice: quoteData?.price ?? profileData?.price,
    marketCap: quoteData?.marketCap ?? profileData?.mktCap,
    trailingPE: quoteData?.pe ?? ratioData?.priceEarningsRatioTTM,
    priceToBook: ratioData?.priceToBookRatioTTM,
    priceToSales: ratioData?.priceToSalesRatioTTM,
    eps: quoteData?.eps,
    roe: ratioData?.returnOnEquityTTM,
    roa: ratioData?.returnOnAssetsTTM,
    grossMargin: ratioData?.grossProfitMarginTTM,
    operatingMargin: ratioData?.operatingProfitMarginTTM,
    netMargin: ratioData?.netProfitMarginTTM,
    dividendYield: ratioData?.dividendYieldTTM ?? ratioData?.dividendYielTTM,
    beta: profileData?.beta,
    fiftyTwoWeekHigh: quoteData?.yearHigh,
    fiftyTwoWeekLow: quoteData?.yearLow,
    currency: profileData?.currency ?? "USD",
    period: "FMP latest",
  };
  const score = calculateFundamentalScore(snapshot);
  const errors = [quote, profile, ratios].filter((item) => !item.ok).map((item) => item.error);

  return {
    symbol,
    provider: "fmp",
    assetClass: request.assetClass ?? getFundamentalsAssetClass(symbol),
    sourceLabel: "FMP provider",
    isFallback: false,
    fetchedAt: new Date().toISOString(),
    snapshot,
    fundamentalScore: score,
    interpretation: buildFundamentalsInterpretation(snapshot, score),
    warnings: errors.length ? errors : undefined,
    error: Object.values(snapshot).some((value) => value !== undefined && value !== null) ? undefined : errors[0] ?? "FMP returned no usable fundamentals.",
  };
}

export async function getFmpNews(symbol: string): Promise<ProviderResult<NewsArticle[]>> {
  const result = await fetchFmp<FmpNews>("/stock_news", { tickers: normalizeSymbol(symbol), limit: "8" });
  if (!result.ok) return result;
  return {
    ok: true,
    provider: "fmp",
    data: result.data.map((item) => ({
      title: item.title ?? "Market update",
      source: item.site ?? "FMP",
      url: item.url ?? "#",
      publishedAt: item.publishedDate,
      summary: item.text?.slice(0, 240),
      relatedSymbols: item.symbol ? [item.symbol] : [normalizeSymbol(symbol)],
      provider: "fmp",
      isFallback: false,
    })),
  };
}
