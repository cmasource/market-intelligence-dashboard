import type { MarketDataProviderName } from "@/lib/market-data/types";

export type IntelligenceLanguage = "en" | "es";

export type IntelligenceTone = "positive" | "neutral" | "negative" | "warning";

export type HumanInterpretationSummary = {
  shortSummary: string;
  expandedSummary: string;
  bulletPoints: string[];
  warnings: string[];
};

export type PriceSummary = {
  price: number | null;
  currency: string;
  change: number | null;
  changePercent: number | null;
  provider: MarketDataProviderName | "unavailable";
  sourceLabel: string;
  isFallback: boolean;
};

export type MarketSignalSummary = {
  score: number | null;
  label: string;
  confidence: string;
  explanation: string;
};

export type TechnicalSummary = {
  available: boolean;
  score: number | null;
  trend: string;
  momentum: string;
  keyIndicators: string[];
  interpretation: string;
  humanSummary?: HumanInterpretationSummary;
  sourceLabel: string;
};

export type FundamentalSummary = {
  available: boolean;
  score: number | null;
  valuation: string;
  profitability: string;
  solvency: string;
  growth: string;
  interpretation: string;
  humanSummary?: HumanInterpretationSummary;
  sourceLabel: string;
};

export type NewsSummary = {
  available: boolean;
  articlesCount: number;
  latestHeadlines: Array<{
    title: string;
    source: string;
    url: string;
    publishedAt?: string;
  }>;
  interpretation: string;
  sourceLabel: string;
};

export type RiskSummary = {
  level: "low" | "medium" | "high" | "very_high";
  keyRisks: string[];
  riskNotes: string[];
};

export type FinalReading = {
  label: string;
  summary: string;
  bulletPoints: string[];
};

export type CedearSummary = {
  available: boolean;
  localPrice: number | null;
  localCurrency: string;
  underlyingSymbol: string;
  underlyingName: string;
  underlyingPrice: number | null;
  impliedCcl: number | null;
  interpretation: string;
  sourceLabel: string;
};

export type FixedIncomeSummary = {
  available: boolean;
  instrumentType: string;
  estimatedYTM: number | null;
  modifiedDuration: number | null;
  parity: number | null;
  interpretation: string;
  sourceLabel: string;
};

export type CnvSummary = {
  available: boolean;
  issuerName: string;
  documentsCount: number;
  latestDocuments: Array<{
    title: string;
    documentType: string;
    publishedAt: string;
    sourceLabel: string;
  }>;
  interpretation: string;
  sourceLabel: string;
};

export type DataCoverageSummary = {
  price: string;
  chart: string;
  technical: string;
  fundamentals: string;
  news: string;
  fixedIncome?: string;
  notes: string[];
};

export type AssetIntelligenceReport = {
  symbol: string;
  name: string;
  category: string;
  market: string;
  currency: string;
  priceSummary: PriceSummary;
  marketSignalSummary: MarketSignalSummary;
  technicalSummary: TechnicalSummary;
  fundamentalSummary: FundamentalSummary;
  newsSummary: NewsSummary;
  cedearSummary?: CedearSummary;
  fixedIncomeSummary?: FixedIncomeSummary;
  cnvSummary?: CnvSummary;
  riskSummary: RiskSummary;
  dataCoverageSummary: DataCoverageSummary;
  finalReading: FinalReading;
  warnings: string[];
  sourceLabels: string[];
  generatedAt: string;
};
