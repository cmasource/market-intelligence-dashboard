import { instrumentMasterSeed } from "@/lib/instruments/instrument-master.seed";
import type { Instrument } from "@/lib/instruments/types";
import type { HeatmapFilters, HeatmapItem, HeatmapSegment, HeatmapSourceKind } from "./heatmap-types";

function getSegment(instrument: Instrument): Exclude<HeatmapSegment, "all"> {
  if (instrument.assetClass === "cedear" || instrument.assetClass === "cedear_etf") return "cedears";
  if (instrument.market === "argentina" && instrument.assetClass === "stock") return "argentina";
  if (instrument.assetClass === "crypto") return "crypto";
  if (instrument.assetClass === "etf") return "etfs";
  if (["bond", "bill", "corporate_bond"].includes(instrument.assetClass)) return "bonds";
  return "usa";
}

function getSourceKind(instrument: Instrument): HeatmapSourceKind {
  if (instrument.dataCapabilities.some((capability) => ["technical_full", "technical_underlying", "quote_only"].includes(capability))) {
    return "provider";
  }
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
  return instrumentMasterSeed.map((instrument) => {
    const segment = getSegment(instrument);
    const sourceKind = getSourceKind(instrument);
    return {
      symbol: instrument.symbol,
      name: instrument.name,
      segment,
      assetType: instrument.assetClass,
      typeLabel: instrument.assetClass.replaceAll("_", " "),
      href: `/asset/${encodeURIComponent(instrument.symbol)}`,
      price: null,
      currency: instrument.currency,
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
