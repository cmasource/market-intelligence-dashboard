import { mockAssets } from "@/lib/mock-data";
import type { Asset } from "@/types/asset";
import type { HeatmapFilters, HeatmapItem, HeatmapSegment, HeatmapSourceKind } from "./heatmap-types";

const manualArgentinaSymbols = new Set(["AL30", "GD30", "TX26", "GGAL", "YPFD", "AAPL", "KO"]);

function getSegment(asset: Asset): Exclude<HeatmapSegment, "all"> {
  if (asset.type === "cedear") return "cedears";
  if (asset.type === "argentine_equity") return "argentina";
  if (asset.type === "crypto") return "crypto";
  if (asset.type === "etf") return "etfs";
  if (asset.type.includes("bond") || asset.type === "letra") return "bonds";
  return "usa";
}

function getSourceKind(asset: Asset): HeatmapSourceKind {
  const symbol = asset.symbol.toUpperCase();

  if (manualArgentinaSymbols.has(symbol) && (asset.argentinaContext || asset.type === "cedear" || asset.type.includes("bond") || asset.type === "letra")) {
    return "manual";
  }
  if (asset.argentinaContext || asset.type === "cedear" || asset.type.includes("bond") || asset.type === "letra") {
    return "mock";
  }
  if (asset.type === "crypto") return "fallback";
  return "provider";
}

function sourceLabel(sourceKind: HeatmapSourceKind) {
  const labels: Record<HeatmapSourceKind, string> = {
    provider: "Provider",
    yahoo: "Yahoo compatible",
    manual: "Manual validated",
    mock: "Structured mock",
    future: "Future",
    fallback: "Fallback",
    unavailable: "Unavailable",
  };

  return labels[sourceKind];
}

function shouldHideStaticPrice(asset: Asset, sourceKind: HeatmapSourceKind) {
  return sourceKind === "provider" || sourceKind === "fallback" || asset.type === "crypto";
}

export function getBaseHeatmapItems(): HeatmapItem[] {
  return mockAssets.map((asset) => {
    const segment = getSegment(asset);
    const sourceKind = getSourceKind(asset);
    const price = shouldHideStaticPrice(asset, sourceKind)
      ? null
      : typeof asset.marketDisplayPrice === "number"
        ? asset.marketDisplayPrice
        : asset.price;

    return {
      symbol: asset.symbol,
      name: asset.name,
      segment,
      assetType: asset.type,
      typeLabel: asset.typeLabel,
      href: `/asset/${encodeURIComponent(asset.symbol)}`,
      price,
      currency: asset.priceDisplayCurrency ?? asset.quoteCurrency ?? asset.currency,
      changePercent: Number.isFinite(asset.dailyChange) ? asset.dailyChange : null,
      sourceKind,
      sourceLabel: sourceLabel(sourceKind),
      isRealOrManual: sourceKind === "provider" || sourceKind === "yahoo" || sourceKind === "manual",
      isSimulated: sourceKind === "mock",
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
