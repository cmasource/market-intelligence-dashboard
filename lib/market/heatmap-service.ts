import { mockAssets } from "@/lib/mock-data";
import type { Asset } from "@/types/asset";
import type { HeatmapFilters, HeatmapItem, HeatmapSegment, HeatmapSourceKind } from "./heatmap-types";

function getSegment(asset: Asset): Exclude<HeatmapSegment, "all"> {
  if (asset.type === "cedear") return "cedears";
  if (asset.type === "argentine_equity") return "argentina";
  if (asset.type === "crypto") return "crypto";
  if (asset.type === "etf") return "etfs";
  if (asset.type.includes("bond") || asset.type === "letra") return "bonds";
  return "usa";
}

function getSourceKind(asset: Asset): HeatmapSourceKind {
  void asset;
  return "unavailable";
}

function sourceLabel(sourceKind: HeatmapSourceKind) {
  const labels: Record<HeatmapSourceKind, string> = {
    provider: "Provider",
    yahoo: "Yahoo compatible",
    manual: "Manual validated",
    mock: "Unavailable",
    future: "Future",
    fallback: "Fallback",
    unavailable: "Unavailable",
  };

  return labels[sourceKind];
}

export function getBaseHeatmapItems(): HeatmapItem[] {
  return mockAssets.map((asset) => {
    const segment = getSegment(asset);
    const sourceKind = getSourceKind(asset);
    return {
      symbol: asset.symbol,
      name: asset.name,
      segment,
      assetType: asset.type,
      typeLabel: asset.typeLabel,
      href: `/asset/${encodeURIComponent(asset.symbol)}`,
      price: null,
      currency: asset.priceDisplayCurrency ?? asset.quoteCurrency ?? asset.currency,
      changePercent: null,
      sourceKind,
      sourceLabel: sourceLabel(sourceKind),
      isRealOrManual: sourceKind === "provider" || sourceKind === "yahoo" || sourceKind === "manual",
      isSimulated: false,
    };
  });
}

export function filterHeatmapItems(items: HeatmapItem[], filters: HeatmapFilters) {
  return items.filter((item) => {
    if (filters.segment !== "all" && item.segment !== filters.segment) return false;
    if (!filters.includeSimulated && !item.isRealOrManual) return false;
    return true;
  });
}

export function sortHeatmapItems(items: HeatmapItem[], filters: HeatmapFilters) {
  return [...items].sort((a, b) => {
    if (filters.sort === "symbol") return a.symbol.localeCompare(b.symbol);
    if (filters.sort === "source") {
      const sourceSort = a.sourceKind.localeCompare(b.sourceKind);
      return sourceSort === 0 ? a.symbol.localeCompare(b.symbol) : sourceSort;
    }

    const aChange = a.changePercent ?? 0;
    const bChange = b.changePercent ?? 0;
    if (filters.sort === "absoluteChange") return Math.abs(bChange) - Math.abs(aChange);
    return bChange - aChange;
  });
}
