export type DataCoverageStatus =
  | "real"
  | "provider"
  | "fallback"
  | "mock"
  | "future"
  | "not_applicable"
  | "unavailable";

export type DataLayer =
  | "price"
  | "chart"
  | "technical"
  | "fundamentals"
  | "fixed_income"
  | "news"
  | "ai_summary";

export type InstrumentDataCoverage = {
  symbol: string;
  price: DataCoverageStatus;
  chart: DataCoverageStatus;
  technical: DataCoverageStatus;
  fundamentals: DataCoverageStatus;
  fixedIncome: DataCoverageStatus;
  news: DataCoverageStatus;
  aiSummary: DataCoverageStatus;
  notes?: string[];
};

export type DataCoverageLanguage = "en" | "es";

export type DataCoverageGroup = "real_provider" | "mock_fallback" | "future" | "not_applicable";
