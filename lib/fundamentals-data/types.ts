export type FundamentalsProviderName = "mock" | "manual" | "yahoo" | "fmp" | "finnhub" | "alpha_vantage" | "unavailable";

export type FundamentalsAssetClass =
  | "stock"
  | "etf"
  | "cedear"
  | "argentine_equity"
  | "crypto"
  | "bond"
  | "unknown";

export type FundamentalsRequest = {
  symbol: string;
  assetClass?: FundamentalsAssetClass;
};

export type FundamentalsListingContext = {
  basis: "direct" | "underlying_adr";
  requestedSymbol: string;
  providerSymbol: string;
  market?: string;
  currency?: string;
};

export type FundamentalsMetricSource = "reported" | "calculated" | "provider" | "mock" | "unavailable";

export type FundamentalsSnapshot = {
  marketPrice?: number;
  marketCap?: number;
  enterpriseValue?: number;
  trailingPE?: number;
  forwardPE?: number;
  priceToBook?: number;
  priceToSales?: number;
  pegRatio?: number;
  eps?: number;
  bookValuePerShare?: number;
  roe?: number;
  roa?: number;
  grossMargin?: number;
  operatingMargin?: number;
  ebitdaMargin?: number;
  netMargin?: number;
  revenueGrowth?: number;
  earningsGrowth?: number;
  debtToEquity?: number;
  currentRatio?: number;
  quickRatio?: number;
  dividendYield?: number;
  beta?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  currency?: string;
  reportingCurrency?: string;
  fiscalYear?: string;
  period?: string;
};

export type FundamentalsInterpretation = {
  label: string;
  tone: "positive" | "neutral" | "negative" | "warning";
  summary: string;
  bulletPoints: string[];
};

export type FundamentalsProviderTraceEntry = {
  provider: FundamentalsProviderName;
  attempted: boolean;
  success: boolean;
  sourceLabel: string;
  error?: string;
};

export type FundamentalsResponse = {
  symbol: string;
  provider: FundamentalsProviderName;
  assetClass: FundamentalsAssetClass;
  sourceLabel: string;
  isFallback: boolean;
  fetchedAt?: string;
  snapshot: FundamentalsSnapshot;
  fundamentalScore?: number | null;
  interpretation: FundamentalsInterpretation;
  missingFields?: string[];
  coverageRatio?: number;
  providerTrace?: FundamentalsProviderTraceEntry[];
  listingContext?: FundamentalsListingContext;
  warnings?: string[];
  error?: string;
};
