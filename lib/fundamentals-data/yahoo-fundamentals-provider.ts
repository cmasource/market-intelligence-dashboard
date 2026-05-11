import type { FundamentalsRequest, FundamentalsResponse, FundamentalsSnapshot } from "./types";
import { buildFundamentalsInterpretation, calculateFundamentalScore } from "./fundamentals-score";
import { getFundamentalsAssetClass, getYahooFundamentalsSymbol, normalizeFundamentalsSymbol } from "./symbol-map";

type YahooRawValue = { raw?: number; fmt?: string };
type YahooModule = Record<string, YahooRawValue | string | number | undefined>;
type YahooResponse = {
  quoteSummary?: {
    result?: Array<{
      price?: YahooModule;
      summaryDetail?: YahooModule;
      defaultKeyStatistics?: YahooModule;
      financialData?: YahooModule;
    }> | null;
    error?: { description?: string } | null;
  };
};

function raw(module: YahooModule | undefined, key: string) {
  const value = module?.[key];
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "object" && value !== null && "raw" in value && typeof value.raw === "number") {
    return Number.isFinite(value.raw) ? value.raw : undefined;
  }
  return undefined;
}

function text(module: YahooModule | undefined, key: string) {
  const value = module?.[key];
  return typeof value === "string" ? value : undefined;
}

function decimal(value: number | undefined) {
  if (value === undefined) return undefined;
  return Math.abs(value) > 1.5 ? value / 100 : value;
}

function debtToEquity(value: number | undefined) {
  if (value === undefined) return undefined;
  return value > 10 ? value / 100 : value;
}

function failureResponse(request: FundamentalsRequest, error: string): FundamentalsResponse {
  const symbol = normalizeFundamentalsSymbol(request.symbol);

  return {
    symbol,
    provider: "yahoo",
    assetClass: request.assetClass ?? getFundamentalsAssetClass(symbol),
    sourceLabel: "Provider fundamentals",
    isFallback: false,
    fetchedAt: new Date().toISOString(),
    snapshot: {},
    fundamentalScore: null,
    interpretation: buildFundamentalsInterpretation({}, null),
    error,
  };
}

function hasMeaningfulSnapshot(snapshot: FundamentalsSnapshot) {
  return Object.values(snapshot).some((value) => value !== undefined && value !== null);
}

export async function getYahooFundamentals(request: FundamentalsRequest): Promise<FundamentalsResponse> {
  const symbol = normalizeFundamentalsSymbol(request.symbol);
  const yahooSymbol = getYahooFundamentalsSymbol(symbol);

  if (!yahooSymbol) return failureResponse(request, "Yahoo fundamentals provider does not support this symbol in Sprint 7.");

  const url = new URL(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(yahooSymbol)}`);
  url.searchParams.set("modules", "price,summaryDetail,defaultKeyStatistics,financialData");

  try {
    // Adaptador MVP sin credenciales. Puede reemplazarse por proveedores licenciados, SEC EDGAR,
    // Financial Modeling Prep, Polygon, Intrinio u otras fuentes formales.
    const response = await fetch(url, {
      headers: { "User-Agent": "CMA Market Intelligence fundamentals MVP" },
      next: { revalidate: 300 },
    });

    if (!response.ok) return failureResponse(request, `Yahoo fundamentals provider returned HTTP ${response.status}.`);

    const data = (await response.json()) as YahooResponse;
    const providerError = data.quoteSummary?.error?.description;
    const result = data.quoteSummary?.result?.[0];

    if (providerError) return failureResponse(request, providerError);
    if (!result) return failureResponse(request, "Yahoo fundamentals provider returned no result.");

    const snapshot: FundamentalsSnapshot = {
      marketPrice: raw(result.price, "regularMarketPrice"),
      marketCap: raw(result.price, "marketCap"),
      enterpriseValue: raw(result.defaultKeyStatistics, "enterpriseValue"),
      trailingPE: raw(result.summaryDetail, "trailingPE"),
      forwardPE: raw(result.summaryDetail, "forwardPE"),
      priceToBook: raw(result.defaultKeyStatistics, "priceToBook"),
      priceToSales: raw(result.summaryDetail, "priceToSalesTrailing12Months"),
      pegRatio: raw(result.defaultKeyStatistics, "pegRatio"),
      eps: raw(result.defaultKeyStatistics, "trailingEps") ?? raw(result.defaultKeyStatistics, "forwardEps"),
      bookValuePerShare: raw(result.defaultKeyStatistics, "bookValue"),
      roe: decimal(raw(result.financialData, "returnOnEquity")),
      roa: decimal(raw(result.financialData, "returnOnAssets")),
      grossMargin: decimal(raw(result.financialData, "grossMargins")),
      operatingMargin: decimal(raw(result.financialData, "operatingMargins")),
      ebitdaMargin: decimal(raw(result.financialData, "ebitdaMargins")),
      netMargin: decimal(raw(result.defaultKeyStatistics, "profitMargins")),
      revenueGrowth: decimal(raw(result.financialData, "revenueGrowth")),
      earningsGrowth: decimal(raw(result.financialData, "earningsGrowth")),
      debtToEquity: debtToEquity(raw(result.financialData, "debtToEquity")),
      currentRatio: raw(result.financialData, "currentRatio"),
      quickRatio: raw(result.financialData, "quickRatio"),
      dividendYield: decimal(raw(result.summaryDetail, "dividendYield")),
      beta: raw(result.defaultKeyStatistics, "beta"),
      fiftyTwoWeekHigh: raw(result.summaryDetail, "fiftyTwoWeekHigh"),
      fiftyTwoWeekLow: raw(result.summaryDetail, "fiftyTwoWeekLow"),
      currency: text(result.price, "currency"),
      period: "Provider latest",
    };
    const fundamentalScore = calculateFundamentalScore(snapshot);

    return {
      symbol,
      provider: "yahoo",
      assetClass: request.assetClass ?? getFundamentalsAssetClass(symbol),
      sourceLabel: "Provider fundamentals",
      isFallback: false,
      fetchedAt: new Date().toISOString(),
      snapshot,
      fundamentalScore,
      interpretation: buildFundamentalsInterpretation(snapshot, fundamentalScore),
      warnings: hasMeaningfulSnapshot(snapshot) ? undefined : ["Provider returned no usable fundamentals."],
    };
  } catch (error) {
    return failureResponse(request, error instanceof Error ? error.message : "Yahoo fundamentals provider request failed.");
  }
}
