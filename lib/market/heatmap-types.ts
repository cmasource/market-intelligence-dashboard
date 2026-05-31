export type HeatmapSegment = "all" | "usa" | "cedears" | "argentina" | "bonds" | "crypto" | "etfs";

export type HeatmapSort = "change" | "absoluteChange" | "symbol" | "source";

export type HeatmapSourceKind = "provider" | "yahoo" | "manual" | "mock" | "future" | "fallback" | "unavailable";

export type HeatmapItem = {
  symbol: string;
  name: string;
  segment: Exclude<HeatmapSegment, "all">;
  assetType: string;
  typeLabel: string;
  href: string;
  price: number | null;
  currency: string;
  changePercent: number | null;
  sourceKind: HeatmapSourceKind;
  sourceLabel: string;
  isRealOrManual: boolean;
  isSimulated: boolean;
};

export type HeatmapFilters = {
  segment: HeatmapSegment;
  sort: HeatmapSort;
  includeSimulated: boolean;
};
