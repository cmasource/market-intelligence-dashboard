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

type YahooTimeseriesPoint = {
  asOfDate?: string;
  currencyCode?: string;
  reportedValue?: YahooRawValue;
};

type YahooTimeseriesResult = {
  meta?: { type?: string[] };
  [key: string]: YahooTimeseriesPoint[] | { type?: string[] } | undefined;
};

type YahooTimeseriesResponse = {
  timeseries?: {
    result?: YahooTimeseriesResult[];
    error?: { description?: string } | null;
  };
};

const marketSeriesTypes = [
  "trailingMarketCap",
  "trailingEnterpriseValue",
  "trailingPeRatio",
  "trailingForwardPeRatio",
  "trailingPsRatio",
  "trailingPbRatio",
  "trailingPegRatio",
  "trailingDividendYield",
];

const statementSeriesTypes = [
  "trailingBasicEPS",
  "trailingDilutedEPS",
  "trailingTotalRevenue",
  "trailingNetIncome",
  "trailingGrossProfit",
  "trailingOperatingIncome",
  "trailingEBITDA",
  "quarterlyTotalRevenue",
  "quarterlyNetIncome",
  "quarterlyTotalAssets",
  "quarterlyStockholdersEquity",
  "quarterlyTotalDebt",
  "quarterlyCurrentAssets",
  "quarterlyCurrentLiabilities",
  "trailingDilutedAverageShares",
  "trailingBasicAverageShares",
];

function divide(numerator: number | undefined, denominator: number | undefined) {
  if (numerator === undefined || denominator === undefined || denominator === 0) return undefined;
  const value = numerator / denominator;
  return Number.isFinite(value) ? value : undefined;
}

function timeseriesMap(data: YahooTimeseriesResponse) {
  return new Map<string, YahooTimeseriesPoint[]>(
    (data.timeseries?.result ?? []).flatMap((item) => {
      const type = item.meta?.type?.[0];
      const points = type ? item[type] : undefined;
      return type && Array.isArray(points) ? [[type, points] as [string, YahooTimeseriesPoint[]]] : [];
    }),
  );
}

function latestPoint(series: Map<string, YahooTimeseriesPoint[]>, type: string) {
  return series.get(type)?.at(-1);
}

function latestValue(series: Map<string, YahooTimeseriesPoint[]>, type: string) {
  const value = latestPoint(series, type)?.reportedValue?.raw;
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function yearOverYear(series: Map<string, YahooTimeseriesPoint[]>, type: string) {
  const points = series.get(type) ?? [];
  const latest = points.at(-1)?.reportedValue?.raw;
  const previous = points.at(-5)?.reportedValue?.raw;
  if (latest === undefined || previous === undefined || previous <= 0 || latest < 0) return undefined;
  return divide(latest - previous, previous);
}

async function getYahooTimeseriesFundamentals(request: FundamentalsRequest, yahooSymbol: string) {
  const url = new URL(`https://query2.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(yahooSymbol)}`);
  url.searchParams.set("symbol", yahooSymbol);
  url.searchParams.set("type", [...marketSeriesTypes, ...statementSeriesTypes].join(","));
  url.searchParams.set("merge", "false");
  url.searchParams.set("period1", String(Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 365 * 5));
  url.searchParams.set("period2", String(Math.floor(Date.now() / 1000) + 60 * 60 * 24));

  const response = await fetch(url, {
    headers: { "User-Agent": "CMA Market Intelligence fundamentals" },
    next: { revalidate: 3600 },
  });
  if (!response.ok) return failureResponse(request, `Yahoo fundamentals timeseries returned HTTP ${response.status}.`);

  const data = (await response.json()) as YahooTimeseriesResponse;
  const providerError = data.timeseries?.error?.description;
  if (providerError) return failureResponse(request, providerError);

  const series = timeseriesMap(data);
  const revenue = latestValue(series, "trailingTotalRevenue");
  const netIncome = latestValue(series, "trailingNetIncome");
  const equity = latestValue(series, "quarterlyStockholdersEquity");
  const assets = latestValue(series, "quarterlyTotalAssets");
  const shares = latestValue(series, "trailingDilutedAverageShares")
    ?? latestValue(series, "trailingBasicAverageShares");
  const marketCurrency = latestPoint(series, "trailingMarketCap")?.currencyCode ?? "USD";
  const reportingCurrency = latestPoint(series, "trailingTotalRevenue")?.currencyCode;
  const currenciesMatch = !reportingCurrency || reportingCurrency === marketCurrency;
  const period = [
    latestPoint(series, "trailingTotalRevenue")?.asOfDate,
    latestPoint(series, "trailingNetIncome")?.asOfDate,
  ].filter(Boolean).sort().at(-1);

  const snapshot: FundamentalsSnapshot = {
    marketCap: latestValue(series, "trailingMarketCap"),
    enterpriseValue: latestValue(series, "trailingEnterpriseValue"),
    trailingPE: latestValue(series, "trailingPeRatio"),
    forwardPE: latestValue(series, "trailingForwardPeRatio"),
    priceToBook: latestValue(series, "trailingPbRatio"),
    priceToSales: latestValue(series, "trailingPsRatio"),
    pegRatio: latestValue(series, "trailingPegRatio"),
    eps: currenciesMatch
      ? latestValue(series, "trailingDilutedEPS") ?? latestValue(series, "trailingBasicEPS")
      : undefined,
    bookValuePerShare: currenciesMatch ? divide(equity, shares) : undefined,
    roe: divide(netIncome, equity),
    roa: divide(netIncome, assets),
    grossMargin: divide(latestValue(series, "trailingGrossProfit"), revenue),
    operatingMargin: divide(latestValue(series, "trailingOperatingIncome"), revenue),
    ebitdaMargin: divide(latestValue(series, "trailingEBITDA"), revenue),
    netMargin: divide(netIncome, revenue),
    revenueGrowth: yearOverYear(series, "quarterlyTotalRevenue"),
    earningsGrowth: yearOverYear(series, "quarterlyNetIncome"),
    debtToEquity: divide(latestValue(series, "quarterlyTotalDebt"), equity),
    currentRatio: divide(
      latestValue(series, "quarterlyCurrentAssets"),
      latestValue(series, "quarterlyCurrentLiabilities"),
    ),
    dividendYield: latestValue(series, "trailingDividendYield"),
    currency: marketCurrency,
    reportingCurrency,
    period: period ? `TTM al ${period}` : "Yahoo Finance latest",
  };
  const fundamentalScore = calculateFundamentalScore(snapshot);
  const warnings = !currenciesMatch
    ? [`Los estados financieros se reportan en ${reportingCurrency}; se excluyeron importes por accion no comparables con la cotizacion en ${marketCurrency}.`]
    : undefined;

  return {
    symbol: normalizeFundamentalsSymbol(request.symbol),
    provider: "yahoo" as const,
    assetClass: request.assetClass ?? getFundamentalsAssetClass(request.symbol),
    sourceLabel: "Yahoo Finance fundamentals",
    isFallback: false,
    fetchedAt: new Date().toISOString(),
    snapshot,
    fundamentalScore,
    interpretation: buildFundamentalsInterpretation(snapshot, fundamentalScore),
    warnings: hasMeaningfulSnapshot(snapshot) ? warnings : ["Provider returned no usable fundamentals."],
  } satisfies FundamentalsResponse;
}

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

    if (!response.ok) return getYahooTimeseriesFundamentals(request, yahooSymbol);

    const data = (await response.json()) as YahooResponse;
    const providerError = data.quoteSummary?.error?.description;
    const result = data.quoteSummary?.result?.[0];

    if (providerError) return failureResponse(request, providerError);
    if (!result) return getYahooTimeseriesFundamentals(request, yahooSymbol);

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
