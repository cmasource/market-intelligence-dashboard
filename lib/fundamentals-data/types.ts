export type FundamentalsProviderName = "mock" | "yahoo" | "unavailable";

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
  fiscalYear?: string;
  period?: string;
};

export type FundamentalsInterpretation = {
  label: string;
  tone: "positive" | "neutral" | "negative" | "warning";
  summary: string;
  bulletPoints: string[];
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
  warnings?: string[];
  error?: string;
};
