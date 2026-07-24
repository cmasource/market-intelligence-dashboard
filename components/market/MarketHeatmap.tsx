"use client";

import { useMemo, useState } from "react";
import { HeatmapCell } from "@/components/market/HeatmapCell";
import { HeatmapControls } from "@/components/market/HeatmapControls";
import { useArgentinaQuotes } from "@/lib/hooks/useArgentinaQuotes";
import { useProviderQuotes } from "@/lib/hooks/useProviderQuotes";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { filterHeatmapItems, getBaseHeatmapItems, sortHeatmapItems } from "@/lib/market/heatmap-service";
import type { HeatmapFilters, HeatmapItem, HeatmapSegment, HeatmapSourceKind } from "@/lib/market/heatmap-types";

type MarketHeatmapProps = {
  compact?: boolean;
  defaultSegment?: HeatmapSegment;
};

const segmentTitles: Record<Exclude<HeatmapSegment, "all">, { en: string; es: string }> = {
  usa: { en: "USA", es: "USA" },
  cedears: { en: "CEDEARs", es: "CEDEARs" },
  argentina: { en: "Argentina", es: "Argentina" },
  bonds: { en: "Bonds", es: "Bonos" },
  crypto: { en: "Crypto", es: "Cripto" },
  etfs: { en: "ETFs", es: "ETFs" },
};

function sourceKindFromProvider(provider: string, isFallback: boolean): HeatmapSourceKind {
  if (provider === "yahoo") return "yahoo";
  if (provider === "mock") return "mock";
  return isFallback ? "fallback" : "provider";
}

function sourceKindFromArgentina(source: string): HeatmapSourceKind {
  if (source === "data912" || source === "ppi") return "provider";
  if (source === "manual") return "manual";
  if (source === "mock") return "mock";
  if (source.includes("future")) return "future";
  return "unavailable";
}

function mergeHydratedQuotes(items: HeatmapItem[], providerQuotes: ReturnType<typeof useProviderQuotes>, argentinaQuotes: ReturnType<typeof useArgentinaQuotes>) {
  return items.map((item) => {
    const argentinaQuote = argentinaQuotes[item.symbol.toUpperCase()];
    if (argentinaQuote && !argentinaQuote.isLoading) {
      const sourceKind = sourceKindFromArgentina(argentinaQuote.source);
      return {
        ...item,
        price: argentinaQuote.price ?? null,
        currency: argentinaQuote.currency ?? item.currency,
        changePercent: typeof argentinaQuote.changePercent === "number" ? argentinaQuote.changePercent : null,
        sourceKind,
        sourceLabel: argentinaQuote.sourceLabel,
        isRealOrManual: argentinaQuote.isRealData || sourceKind === "manual",
        isSimulated: sourceKind === "mock",
      };
    }

    const providerQuote = providerQuotes[item.symbol.toUpperCase()];
    if (providerQuote && !providerQuote.isLoading) {
      const sourceKind = sourceKindFromProvider(providerQuote.provider, providerQuote.isFallback);
      return {
        ...item,
        price: providerQuote.price ?? null,
        currency: providerQuote.currency ?? item.currency,
        changePercent: typeof providerQuote.changePercent === "number" ? providerQuote.changePercent : null,
        sourceKind,
        sourceLabel: providerQuote.sourceLabel,
        isRealOrManual: sourceKind === "provider" || sourceKind === "yahoo",
        isSimulated: sourceKind === "mock",
      };
    }

    return {
      ...item,
      price: null,
      changePercent: null,
      sourceKind: "unavailable" as const,
      sourceLabel: "No verified quote",
      isRealOrManual: false,
      isSimulated: false,
    };
  });
}

export function MarketHeatmap({ compact = false, defaultSegment = "all" }: MarketHeatmapProps) {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const [filters, setFilters] = useState<HeatmapFilters>({
    segment: defaultSegment,
    sort: "absoluteChange",
    includeSimulated: true,
  });

  const baseItems = useMemo(() => getBaseHeatmapItems(), []);
  const providerSymbols = useMemo(
    () => baseItems.filter((item) => ["usa", "etfs", "crypto"].includes(item.segment)).map((item) => item.symbol),
    [baseItems],
  );
  const argentinaSymbols = useMemo(
    () => baseItems.filter((item) => ["argentina", "cedears", "bonds"].includes(item.segment)).map((item) => item.symbol),
    [baseItems],
  );
  const providerQuotes = useProviderQuotes(providerSymbols);
  const argentinaQuotes = useArgentinaQuotes(argentinaSymbols);

  const visibleItems = useMemo(() => {
    const hydrated = mergeHydratedQuotes(baseItems, providerQuotes, argentinaQuotes);
    const filtered = filterHeatmapItems(hydrated, filters);
    return sortHeatmapItems(filtered, filters).slice(0, compact ? 18 : 48);
  }, [argentinaQuotes, baseItems, compact, filters, providerQuotes]);

  const groupedItems = useMemo(() => {
    return visibleItems.reduce<Record<string, HeatmapItem[]>>((groups, item) => {
      const key = filters.segment === "all" ? item.segment : filters.segment;
      groups[key] = [...(groups[key] ?? []), item];
      return groups;
    }, {});
  }, [filters.segment, visibleItems]);

  return (
    <section id="market-heatmap" className="cma-panel cma-glow-violet p-5 sm:p-6" data-testid="market-heatmap">
      <div>
        <div>
          <p className="cma-kicker">{isSpanish ? "Mapa de calor" : "Heatmap"}</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {isSpanish ? "Mapa de calor de mercado" : "Market heatmap"}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            {isSpanish
              ? "Vista rapida del comportamiento relativo por instrumento y segmento."
              : "Fast view of relative performance by instrument and segment."}
          </p>
        </div>
      </div>

      {!compact ? (
        <div className="mt-5">
          <HeatmapControls filters={filters} language={language} onChange={setFilters} />
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        {Object.entries(groupedItems).map(([segment, items]) => (
          <div key={segment} className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white">
                {segmentTitles[segment as Exclude<HeatmapSegment, "all">]?.[language] ?? segment}
              </h3>
              <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-400">{items.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
              {items.map((item) => (
                <HeatmapCell key={`${item.segment}-${item.symbol}`} item={item} language={language} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
