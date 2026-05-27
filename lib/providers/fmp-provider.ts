import { buildFundamentalsInterpretation, calculateFundamentalScore } from "@/lib/fundamentals-data/fundamentals-score";
import { getFundamentalsAssetClass, normalizeFundamentalsSymbol } from "@/lib/fundamentals-data/symbol-map";
import type { FundamentalsRequest, FundamentalsResponse, FundamentalsSnapshot } from "@/lib/fundamentals-data/types";
import { getAssetClassForMarketData, normalizeSymbol } from "@/lib/market-data/symbol-map";
import type { MarketDataCandle, MarketDataRequest, MarketDataResponse, MarketQuoteResponse } from "@/lib/market-data/types";
import type { NewsArticle } from "@/lib/news/types";
import { sanitizeNewsText } from "@/lib/news/sanitize-news";
import type { ProviderDiagnosticReason, ProviderResult, ProviderTraceEntry } from "./types";

const baseUrl = "https://financialmodelingprep.com/api/v3";

function apiKey() {
  return process.env.FMP_API_KEY?.trim() ?? "";
}

function disabled<T>(provider: "fmp" = "fmp", endpointName?: string): ProviderResult<T> {
  return {
    ok: false,
    provider,
    disabled: true,
    error: "Missing FMP_API_KEY",
    reason: "missing_key",
    endpointName,
  };
}

function classifyFmpHttpError(statusCode: number): ProviderDiagnosticReason {
  if (statusCode === 429) return "rate_limited";
  if (statusCode === 402 || statusCode === 403) return "plan_restricted";
  return "http_error";
}

async function fetchFmp<T>(
  path: string,
  params: Record<string, string> = {},
  endpointName?: string,
): Promise<ProviderResult<T>> {
  const key = apiKey();
  if (!key) return disabled("fmp", endpointName);

  const url = new URL(`${baseUrl}${path}`);
  url.searchParams.set("apikey", key);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);

  try {
    const response = await fetch(url, { next: { revalidate: 120 } });
    if (!response.ok) {
      return {
        ok: false,
        provider: "fmp",
        error: `FMP returned HTTP ${response.status}`,
        reason: classifyFmpHttpError(response.status),
        statusCode: response.status,
        endpointName,
      };
    }
    const data = await response.json() as T & { "Error Message"?: string; Information?: string; Note?: string };
    const providerMessage = data["Error Message"] ?? data.Information ?? data.Note;
    if (providerMessage) {
      const normalizedMessage = providerMessage.toLowerCase();
      return {
        ok: false,
        provider: "fmp",
        error: providerMessage,
        reason: normalizedMessage.includes("limit") ? "rate_limited" : "plan_restricted",
        endpointName,
      };
    }
    return { ok: true, provider: "fmp", data };
  } catch (error) {
    return {
      ok: false,
      provider: "fmp",
      error: error instanceof Error ? error.message : "FMP request failed",
      reason: "unknown_error",
      endpointName,
    };
  }
}

type FmpHistorical = { historical?: Array<{ date?: string; open?: number; high?: number; low?: number; close?: number; volume?: number }> };
type FmpQuoteItem = {
  symbol?: string;
  price?: number;
  change?: number;
  changesPercentage?: number;
  changePercent?: number;
  exchange?: string;
  timestamp?: number;
  marketCap?: number;
  pe?: number;
  eps?: number;
  sharesOutstanding?: number;
  yearHigh?: number;
  yearLow?: number;
};
type FmpQuote = FmpQuoteItem[];
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
type FmpKeyMetrics = Array<{
  marketCapTTM?: number;
  enterpriseValueTTM?: number;
  peRatioTTM?: number;
  forwardPERatioTTM?: number;
  pbRatioTTM?: number;
  priceToSalesRatioTTM?: number;
  pegRatioTTM?: number;
  netIncomePerShareTTM?: number;
  bookValuePerShareTTM?: number;
  debtToEquityTTM?: number;
  currentRatioTTM?: number;
  dividendYieldTTM?: number;
}>;
type FmpGrowth = Array<{
  revenueGrowth?: number;
  epsgrowth?: number;
  epsGrowth?: number;
}>;
type FmpNews = Array<{ title?: string; site?: string; url?: string; publishedDate?: string; text?: string; symbol?: string }>;

function hasFundamentalMetric(snapshot: FundamentalsSnapshot) {
  return [
    snapshot.marketPrice,
    snapshot.marketCap,
    snapshot.enterpriseValue,
    snapshot.trailingPE,
    snapshot.forwardPE,
    snapshot.priceToBook,
    snapshot.priceToSales,
    snapshot.pegRatio,
    snapshot.eps,
    snapshot.bookValuePerShare,
    snapshot.roe,
    snapshot.roa,
    snapshot.grossMargin,
    snapshot.operatingMargin,
    snapshot.ebitdaMargin,
    snapshot.netMargin,
    snapshot.revenueGrowth,
    snapshot.earningsGrowth,
    snapshot.debtToEquity,
    snapshot.currentRatio,
    snapshot.quickRatio,
    snapshot.dividendYield,
    snapshot.beta,
    snapshot.fiftyTwoWeekHigh,
    snapshot.fiftyTwoWeekLow,
  ].some((value) => value !== undefined && value !== null);
}

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
  const result = await fetchFmp<FmpHistorical>(
    `/historical-price-full/${encodeURIComponent(symbol)}`,
    { timeseries: "260" },
    "historical-price-full",
  );
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
  return fetchFmp<FmpQuote>(`/quote/${encodeURIComponent(normalizeSymbol(symbol))}`, {}, "quote");
}

function validNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function numberValue(value: unknown) {
  if (validNumber(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export async function getFmpQuoteSnapshot(symbol: string): Promise<MarketQuoteResponse> {
  const normalizedSymbol = normalizeSymbol(symbol);
  const result = await getFmpQuote(normalizedSymbol);
  const quote = result.ok ? result.data[0] : undefined;
  const price = numberValue(quote?.price);

  if (!result.ok) {
    return {
      symbol: normalizedSymbol,
      price: null,
      change: null,
      changePercent: null,
      currency: "USD",
      provider: "fmp",
      sourceLabel: "FMP provider",
      isFallback: false,
      fetchedAt: new Date().toISOString(),
      error: result.error,
      providerTrace: [
        {
          provider: "fmp",
          attempted: true,
          success: false,
          reason: result.reason ?? "unknown_error",
          statusCode: result.statusCode,
          endpointName: "quote",
          sourceLabel: "FMP provider",
        },
      ],
    };
  }

  if (!Array.isArray(result.data)) {
    return {
      symbol: normalizedSymbol,
      price: null,
      change: null,
      changePercent: null,
      currency: "USD",
      provider: "fmp",
      sourceLabel: "FMP provider",
      isFallback: false,
      fetchedAt: new Date().toISOString(),
      error: "FMP returned an invalid quote response shape.",
      providerTrace: [buildFmpTrace(false, "invalid_response_shape")],
    };
  }

  if (result.data.length === 0) {
    return {
      symbol: normalizedSymbol,
      price: null,
      change: null,
      changePercent: null,
      currency: "USD",
      provider: "fmp",
      sourceLabel: "FMP provider",
      isFallback: false,
      fetchedAt: new Date().toISOString(),
      error: "FMP returned an empty quote response.",
      providerTrace: [buildFmpTrace(false, "empty_response")],
    };
  }

  if (price === null || price <= 0) {
    return {
      symbol: normalizedSymbol,
      price: null,
      change: null,
      changePercent: null,
      currency: "USD",
      provider: "fmp",
      sourceLabel: "FMP provider",
      isFallback: false,
      fetchedAt: new Date().toISOString(),
      error: "FMP returned no usable quote price.",
      providerTrace: [buildFmpTrace(false, "invalid_price")],
    };
  }

  const quoteData = quote ?? {};

  return {
    symbol: quoteData.symbol?.trim().toUpperCase() || normalizedSymbol,
    price,
    change: numberValue(quoteData.change),
    changePercent: numberValue(quoteData.changesPercentage) ?? numberValue(quoteData.changePercent),
    currency: "USD",
    provider: "fmp",
    sourceLabel: "FMP provider",
    isFallback: false,
    fetchedAt: quoteData.timestamp ? new Date(quoteData.timestamp * 1000).toISOString() : new Date().toISOString(),
    providerTrace: [buildFmpTrace(true)],
  };
}

function buildFmpTrace(success: boolean, reason?: ProviderDiagnosticReason): ProviderTraceEntry {
  return {
    provider: "fmp",
    attempted: true,
    success,
    reason,
    endpointName: "quote",
    sourceLabel: "FMP provider",
  };
}

export async function getFmpCompanyProfile(symbol: string) {
  return fetchFmp<FmpProfile>(`/profile/${encodeURIComponent(normalizeSymbol(symbol))}`);
}

export async function getFmpFundamentals(request: FundamentalsRequest): Promise<FundamentalsResponse> {
  const symbol = normalizeFundamentalsSymbol(request.symbol);
  const [quote, profile, ratios, keyMetrics, growth] = await Promise.all([
    getFmpQuote(symbol),
    getFmpCompanyProfile(symbol),
    fetchFmp<FmpRatios>(`/ratios-ttm/${encodeURIComponent(symbol)}`, {}, "ratios-ttm"),
    fetchFmp<FmpKeyMetrics>(`/key-metrics-ttm/${encodeURIComponent(symbol)}`, {}, "key-metrics-ttm"),
    fetchFmp<FmpGrowth>(`/financial-growth/${encodeURIComponent(symbol)}`, { limit: "1" }, "financial-growth"),
  ]);

  const quoteData = quote.ok ? quote.data[0] : undefined;
  const profileData = profile.ok ? profile.data[0] : undefined;
  const ratioData = ratios.ok ? ratios.data[0] : undefined;
  const keyMetricData = keyMetrics.ok ? keyMetrics.data[0] : undefined;
  const growthData = growth.ok ? growth.data[0] : undefined;
  const snapshot: FundamentalsSnapshot = {
    marketPrice: quoteData?.price ?? profileData?.price,
    marketCap: quoteData?.marketCap ?? profileData?.mktCap ?? keyMetricData?.marketCapTTM,
    enterpriseValue: keyMetricData?.enterpriseValueTTM,
    trailingPE: quoteData?.pe ?? ratioData?.priceEarningsRatioTTM ?? keyMetricData?.peRatioTTM,
    forwardPE: keyMetricData?.forwardPERatioTTM,
    priceToBook: ratioData?.priceToBookRatioTTM ?? keyMetricData?.pbRatioTTM,
    priceToSales: ratioData?.priceToSalesRatioTTM ?? keyMetricData?.priceToSalesRatioTTM,
    pegRatio: keyMetricData?.pegRatioTTM,
    eps: quoteData?.eps,
    bookValuePerShare: keyMetricData?.bookValuePerShareTTM,
    roe: ratioData?.returnOnEquityTTM,
    roa: ratioData?.returnOnAssetsTTM,
    grossMargin: ratioData?.grossProfitMarginTTM,
    operatingMargin: ratioData?.operatingProfitMarginTTM,
    netMargin: ratioData?.netProfitMarginTTM,
    revenueGrowth: growthData?.revenueGrowth,
    earningsGrowth: growthData?.epsGrowth ?? growthData?.epsgrowth,
    debtToEquity: keyMetricData?.debtToEquityTTM,
    currentRatio: keyMetricData?.currentRatioTTM,
    dividendYield: ratioData?.dividendYieldTTM ?? ratioData?.dividendYielTTM ?? keyMetricData?.dividendYieldTTM,
    beta: profileData?.beta,
    fiftyTwoWeekHigh: quoteData?.yearHigh,
    fiftyTwoWeekLow: quoteData?.yearLow,
    currency: profileData?.currency ?? "USD",
    period: "FMP latest",
  };
  const score = calculateFundamentalScore(snapshot);
  const errors = [quote, profile, ratios, keyMetrics, growth].filter((item) => !item.ok).map((item) => item.error);
  const hasUsableMetric = hasFundamentalMetric(snapshot);

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
    error: hasUsableMetric ? undefined : errors[0] ?? "FMP returned no usable fundamentals.",
  };
}

export async function getFmpNews(symbol: string): Promise<ProviderResult<NewsArticle[]>> {
  const result = await fetchFmp<FmpNews>("/stock_news", { tickers: normalizeSymbol(symbol), limit: "8" }, "stock_news");
  if (!result.ok) return result;
  return {
    ok: true,
    provider: "fmp",
    data: result.data.map((item) => ({
      title: sanitizeNewsText(item.title, 180) || "Market update",
      source: sanitizeNewsText(item.site, 80) || "FMP",
      url: item.url ?? "#",
      publishedAt: item.publishedDate,
      summary: sanitizeNewsText(item.text, 240),
      relatedSymbols: item.symbol ? [item.symbol] : [normalizeSymbol(symbol)],
      provider: "fmp",
      isFallback: false,
    })),
  };
}
