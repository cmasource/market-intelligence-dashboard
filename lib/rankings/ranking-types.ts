import type { AssetType } from "@/types/asset";

export type RankingType = "technical" | "fundamental" | "combined" | "performance";

export type PerformancePeriod = "30D" | "180D" | "YTD";

export type RankingItem = {
  symbol: string;
  name: string;
  assetType: AssetType | string;
  market: string;
  price?: number;
  currency?: string;
  changePercent?: number;
  score: number;
  label: string;
  sourceLabel: string;
  isFallback: boolean;
  route: string;
  reason: string;
};

export type RankingResponse = {
  type: RankingType;
  period?: PerformancePeriod;
  generatedAt: string;
  universeSize: number;
  items: RankingItem[];
  limitations: string[];
  sourceSummary: string;
};

export type RankingsBundle = {
  generatedAt: string;
  universeSize: number;
  technical: RankingResponse;
  fundamental: RankingResponse;
  combined: RankingResponse;
  performance: Record<PerformancePeriod, RankingResponse>;
  limitations: string[];
  sourceSummary: string;
};
