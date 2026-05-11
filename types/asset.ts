import type { BondMetrics } from "./bonds";
import type { FundamentalMetrics } from "./fundamentals";
import type { TechnicalIndicators } from "./technical";

export type AssetType =
  | "stock"
  | "etf"
  | "cedear"
  | "argentine_equity"
  | "sovereign_bond"
  | "cer_bond"
  | "corporate_bond"
  | "letra"
  | "crypto"
  | "fx_reference"
  | "index";

export type RiskLevel = "low" | "medium" | "high" | "very_high";

export type Sentiment = "positive" | "neutral" | "negative";

export type ImpactLevel = "low" | "medium" | "high";

export type NewsItem = {
  title: string;
  source: string;
  sentiment: Sentiment;
  impact: ImpactLevel;
  summary: string;
};

export type Asset = {
  symbol: string;
  name: string;
  type: AssetType;
  typeLabel: string;
  market: string;
  currency: string;
  price: number;
  dailyChange: number;
  technicalScore: number;
  fundamentalScore?: number;
  riskLevel: RiskLevel;
  summary: string;
  technical: TechnicalIndicators;
  fundamentals?: FundamentalMetrics;
  bondMetrics?: BondMetrics;
  news: NewsItem[];
  argentinaContext?: boolean;
  cryptoContext?: boolean;
};

export type MarketOverviewItem = {
  name: string;
  value: string;
  dailyChange: number;
  trend: "up" | "down" | "flat";
  context: string;
};
