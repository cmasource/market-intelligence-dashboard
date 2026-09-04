import { buildFundamentalsInterpretation, calculateFundamentalScore } from "@/lib/fundamentals-data/fundamentals-score";
import { getFundamentalsAssetClass, normalizeFundamentalsSymbol } from "@/lib/fundamentals-data/symbol-map";
import type { FundamentalsRequest, FundamentalsResponse, FundamentalsSnapshot } from "@/lib/fundamentals-data/types";
import { getAssetClassForMarketData, normalizeSymbol } from "@/lib/market-data/symbol-map";
import type { MarketDataCandle, MarketDataRequest, MarketDataResponse, MarketQuoteResponse } from "@/lib/market-data/types";
import type { NewsArticle } from "@/lib/news/types";
import { sanitizeNewsText } from "@/lib/news/sanitize-news";
import type { ProviderDiagnosticReason, ProviderResult, ProviderTraceEntry } from "./types";

const baseUrl = "https://www.alphavantage.co/query";

function key() {
  return process.env.ALPHA_VANTAGE_API_KEY?.trim() ?? "";
}

function classifyAlphaMessage(message: string): ProviderDiagnosticReason {
  const normalized = message.toLowerCase();
  if (normalized.includes("rate limit") || normalized.includes("sparingly") || normalized.includes("requests per day")) {
    return "rate_limited";
  }
  if (normalized.includes("premium") || normalized.includes("subscribe")) return "plan_restricted";
  return "unknown_error";
}

async function fetchAlpha<T>(params: Record<string, string>): Promise<ProviderResult<T>> {
  const apiKey = key();
  if (!apiKey) return { ok: false, provider: "alpha_vantage", disabled: true, error: "Missing ALPHA_VANTAGE_API_KEY" };
  const url = new URL(baseUrl);
  url.searchParams.set("apikey", apiKey);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);

  try {
    const response = await fetch(url, { next: { revalidate: 300 } });
    if (!response.ok) return { ok: false, provider: "alpha_vantage", error: `Alpha Vantage returned HTTP ${response.status}` };
    const data = await response.json() as T & { Note?: string; "Error Message"?: string; Information?: string };
    const providerMessage = data.Note ?? data["Error Message"] ?? data.Information;
    if (providerMessage) {
      return {
        ok: false,
        provider: "alpha_vantage",
        error: providerMessage,
        reason: classifyAlphaMessage(providerMessage),
      };
    }
    return { ok: true, provider: "alpha_vantage", data };
  } catch (error) {
    return { ok: false, provider: "alpha_vantage", error: error instanceof Error ? error.message : "Alpha Vantage request failed" };
  }
}

type AlphaDaily = { "Time Series (Daily)"?: Record<string, { "1. open"?: string; "2. high"?: string; "3. low"?: string; "4. close"?: string; "5. volume"?: string }> };
type AlphaQuote = {
  "Global Quote"?: {
    "01. symbol"?: string;
    "03. high"?: string;
    "04. low"?: string;
    "05. price"?: string;
    "07. latest trading day"?: string;
    "09. change"?: string;
    "10. change percent"?: string;
  };
};
type AlphaOverview = Record<string, string | undefined>;
type AlphaNews = { feed?: Array<{ title?: string; source?: string; url?: string; banner_image?: string; time_published?: string; summary?: string; ticker_sentiment?: Array<{ ticker?: string }> }> };

function numberValue(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function decimalValue(value: string | undefined) {
  const parsed = numberValue(value);
  if (parsed === undefined) return undefined;
  return Math.abs(parsed) > 1.5 ? parsed / 100 : parsed;
}

function ratioValue(numerator: string | undefined, denominator: string | undefined) {
  const top = numberValue(numerator);
  const bottom = numberValue(denominator);
  if (top === undefined || bottom === undefined || bottom === 0) return undefined;
  const result = top / bottom;
  return Number.isFinite(result) ? result : undefined;
}

function percentValue(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value.replace("%", "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function hasFundamentalMetric(snapshot: FundamentalsSnapshot) {
  return [
    snapshot.marketCap,
    snapshot.trailingPE,
    snapshot.forwardPE,
    snapshot.priceToBook,
    snapshot.priceToSales,
    snapshot.eps,
    snapshot.roe,
    snapshot.roa,
    snapshot.operatingMargin,
    snapshot.netMargin,
    snapshot.dividendYield,
    snapshot.beta,
    snapshot.fiftyTwoWeekHigh,
    snapshot.fiftyTwoWeekLow,
  ].some((value) => value !== undefined && value !== null);
}

export function getAlphaVantageQuote(symbol: string) {
  return fetchAlpha<AlphaQuote>({ function: "GLOBAL_QUOTE", symbol: normalizeSymbol(symbol) });
}

function buildAlphaQuoteTrace(success: boolean, reason?: ProviderDiagnosticReason): ProviderTraceEntry {
  return {
    provider: "alpha_vantage",
    attempted: true,
    success,
    reason,
    endpointName: "GLOBAL_QUOTE",
    sourceLabel: "Alpha Vantage quote",
  };
}

export async function getAlphaVantageQuoteSnapshot(symbol: string): Promise<MarketQuoteResponse> {
  const normalizedSymbol = normalizeSymbol(symbol);
  const result = await getAlphaVantageQuote(normalizedSymbol);
  const quote = result.ok ? result.data["Global Quote"] : undefined;
  const price = numberValue(quote?.["05. price"]) ?? null;

  if (!result.ok) {
    return {
      symbol: normalizedSymbol,
      price: null,
      change: null,
      changePercent: null,
      currency: "USD",
      provider: "alpha_vantage",
      sourceLabel: "Alpha Vantage quote",
      isFallback: false,
      observedAt: null,
      fetchedAt: new Date().toISOString(),
      dataDelay: "unknown",
      error: result.error,
      providerTrace: [buildAlphaQuoteTrace(false, result.reason ?? "unknown_error")],
    };
  }

  if (!quote || Object.keys(quote).length === 0) {
    return {
      symbol: normalizedSymbol,
      price: null,
      change: null,
      changePercent: null,
      currency: "USD",
      provider: "alpha_vantage",
      sourceLabel: "Alpha Vantage quote",
      isFallback: false,
      observedAt: null,
      fetchedAt: new Date().toISOString(),
      dataDelay: "unknown",
      error: "Alpha Vantage returned an empty quote response.",
      providerTrace: [buildAlphaQuoteTrace(false, "empty_response")],
    };
  }

  if (price === null || price <= 0) {
    return {
      symbol: normalizedSymbol,
      price: null,
      change: null,
      changePercent: null,
      currency: "USD",
      provider: "alpha_vantage",
      sourceLabel: "Alpha Vantage quote",
      isFallback: false,
      observedAt: null,
      fetchedAt: new Date().toISOString(),
      dataDelay: "unknown",
      error: "Alpha Vantage returned no usable quote price.",
      providerTrace: [buildAlphaQuoteTrace(false, "invalid_price")],
    };
  }

  const latestTradingDay = quote["07. latest trading day"];

  return {
    symbol: quote["01. symbol"]?.trim().toUpperCase() || normalizedSymbol,
    price,
    change: numberValue(quote["09. change"]) ?? null,
    changePercent: percentValue(quote["10. change percent"]),
    currency: "USD",
    provider: "alpha_vantage",
    sourceLabel: "Alpha Vantage quote",
    isFallback: false,
    observedAt: latestTradingDay ? new Date(`${latestTradingDay}T21:00:00.000Z`).toISOString() : null,
    fetchedAt: new Date().toISOString(),
    dataDelay: "eod",
    providerTrace: [buildAlphaQuoteTrace(true)],
  };
}

export function getAlphaVantageDaily(symbol: string) {
  return fetchAlpha<AlphaDaily>({ function: "TIME_SERIES_DAILY", symbol: normalizeSymbol(symbol), outputsize: "compact" });
}

export async function getAlphaVantageMarketData(request: MarketDataRequest): Promise<MarketDataResponse> {
  const symbol = normalizeSymbol(request.symbol);
  const result = await getAlphaVantageDaily(symbol);
  const series = result.ok ? result.data["Time Series (Daily)"] ?? {} : {};
  const candles: MarketDataCandle[] = Object.entries(series).map(([date, values]) => ({
    time: Math.floor(new Date(date).getTime() / 1000),
    open: numberValue(values["1. open"]) ?? 0,
    high: numberValue(values["2. high"]) ?? 0,
    low: numberValue(values["3. low"]) ?? 0,
    close: numberValue(values["4. close"]) ?? 0,
    volume: numberValue(values["5. volume"]) ?? 0,
  })).filter((candle) => candle.close > 0).reverse();

  return {
    symbol,
    provider: "alpha_vantage",
    assetClass: request.assetClass ?? getAssetClassForMarketData(symbol),
    timeframe: request.timeframe,
    candles,
    isFallback: false,
    sourceLabel: "Alpha Vantage provider",
    fetchedAt: new Date().toISOString(),
    ...(!result.ok ? { error: result.error } : {}),
  };
}

export function getAlphaVantageOverview(symbol: string) {
  return fetchAlpha<AlphaOverview>({ function: "OVERVIEW", symbol: normalizeSymbol(symbol) });
}

export async function getAlphaVantageFundamentals(request: FundamentalsRequest): Promise<FundamentalsResponse> {
  const symbol = normalizeFundamentalsSymbol(request.symbol);
  const overview = await getAlphaVantageOverview(symbol);
  const data = overview.ok ? overview.data : {};
  const snapshot: FundamentalsSnapshot = {
    marketCap: numberValue(data.MarketCapitalization),
    trailingPE: numberValue(data.TrailingPE),
    forwardPE: numberValue(data.ForwardPE),
    priceToBook: numberValue(data.PriceToBookRatio),
    priceToSales: numberValue(data.PriceToSalesRatioTTM),
    pegRatio: numberValue(data.PEGRatio),
    eps: numberValue(data.EPS),
    bookValuePerShare: numberValue(data.BookValue),
    roe: decimalValue(data.ReturnOnEquityTTM),
    roa: decimalValue(data.ReturnOnAssetsTTM),
    grossMargin: ratioValue(data.GrossProfitTTM, data.RevenueTTM),
    operatingMargin: decimalValue(data.OperatingMarginTTM),
    ebitdaMargin: ratioValue(data.EBITDA, data.RevenueTTM),
    netMargin: decimalValue(data.ProfitMargin),
    revenueGrowth: decimalValue(data.QuarterlyRevenueGrowthYOY),
    earningsGrowth: decimalValue(data.QuarterlyEarningsGrowthYOY),
    dividendYield: decimalValue(data.DividendYield),
    beta: numberValue(data.Beta),
    fiftyTwoWeekHigh: numberValue(data["52WeekHigh"]),
    fiftyTwoWeekLow: numberValue(data["52WeekLow"]),
    currency: data.Currency ?? "USD",
    period: "Alpha Vantage latest",
  };
  const score = calculateFundamentalScore(snapshot);
  const hasUsableMetric = hasFundamentalMetric(snapshot);
  return {
    symbol,
    provider: "alpha_vantage",
    assetClass: request.assetClass ?? getFundamentalsAssetClass(symbol),
    sourceLabel: "Alpha Vantage provider",
    isFallback: false,
    fetchedAt: new Date().toISOString(),
    snapshot,
    fundamentalScore: score,
    interpretation: buildFundamentalsInterpretation(snapshot, score),
    ...(!hasUsableMetric ? { error: overview.ok ? "Alpha Vantage returned no usable fundamentals." : overview.error, warnings: [overview.ok ? "Alpha Vantage returned no usable fundamentals." : overview.error] } : {}),
  };
}

export async function getAlphaVantageNews(symbol: string): Promise<ProviderResult<NewsArticle[]>> {
  const result = await fetchAlpha<AlphaNews>({ function: "NEWS_SENTIMENT", tickers: normalizeSymbol(symbol), limit: "8" });
  if (!result.ok) return result;
  return {
    ok: true,
    provider: "alpha_vantage",
    data: (result.data.feed ?? []).map((item) => ({
      title: sanitizeNewsText(item.title, 180) || "Market update",
      source: sanitizeNewsText(item.source, 80) || "Alpha Vantage",
      url: item.url ?? "#",
      imageUrl: item.banner_image,
      publishedAt: item.time_published,
      summary: sanitizeNewsText(item.summary, 240),
      relatedSymbols: item.ticker_sentiment?.map((ticker) => ticker.ticker ?? "").filter(Boolean),
      provider: "alpha_vantage",
      isFallback: false,
    })),
  };
}
