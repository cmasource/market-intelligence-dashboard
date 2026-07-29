"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AssetLogo } from "@/components/assets/AssetLogo";
import { AppShell } from "@/components/layout/AppShell";
import { MarketHeatmap } from "@/components/market/MarketHeatmap";
import { SortableTableHeader } from "@/components/ui/SortableTableHeader";
import { formatCurrencyValue, formatPercent } from "@/lib/formatters";
import { useProviderQuotes } from "@/lib/hooks/useProviderQuotes";
import { useTechnicalAnalyses } from "@/lib/hooks/useTechnicalAnalyses";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { instrumentUniverse, type InstrumentUniverseItem } from "@/lib/instrument-universe";
import type { TechnicalAnalysisResponse } from "@/lib/analysis/types";
import { nextSortState, sortTableRows, type SortState } from "@/lib/ui/sortable-table";

type View = "overview" | "stocks" | "indicators" | "cedearUnderlyings" | "etfs";
const pageSize = 10;
type UsaSortKey = "asset" | "price" | "change" | "score" | "rsi" | "macd" | "reading";

function tone(score: number | null | undefined) {
  if (typeof score !== "number") return "text-slate-400";
  if (score >= 65) return "bg-emerald-300/12 text-emerald-300 ring-1 ring-emerald-300/25";
  if (score <= 35) return "bg-rose-300/12 text-rose-300 ring-1 ring-rose-300/25";
  return "bg-amber-300/10 text-amber-200 ring-1 ring-amber-300/20";
}

function rsiTone(value: number | null | undefined) {
  if (typeof value !== "number") return "text-slate-400";
  if (value >= 70 || value <= 30) return "bg-amber-300/10 text-amber-200 ring-1 ring-amber-300/20";
  if (value >= 45 && value <= 65) return "bg-emerald-300/12 text-emerald-300 ring-1 ring-emerald-300/25";
  return "bg-white/[0.04] text-slate-300 ring-1 ring-white/10";
}

function macdTone(analysis: TechnicalAnalysisResponse | null | undefined) {
  const macd = analysis?.snapshot.macd;
  const signal = analysis?.snapshot.macdSignal;
  if (typeof macd !== "number" || typeof signal !== "number") return "text-slate-400";
  return macd >= signal ? "bg-emerald-300/12 text-emerald-300 ring-1 ring-emerald-300/25" : "bg-rose-300/12 text-rose-300 ring-1 ring-rose-300/25";
}

export default function UsaPage() {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const [view, setView] = useState<View>("overview");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortState<UsaSortKey>>({ key: "asset", direction: "asc" });
  const stocks = useMemo(() => instrumentUniverse.filter((item) => item.country === "US" && item.category === "equity" && item.isSearchable), []);
  const etfs = useMemo(() => instrumentUniverse.filter((item) => item.category === "etf" && item.isSearchable), []);
  const cedearUnderlyings = useMemo(() => {
    const seen = new Set<string>();
    return instrumentUniverse.filter((item) => {
      if (item.category !== "cedear" || !item.underlyingSymbol || seen.has(item.underlyingSymbol)) return false;
      seen.add(item.underlyingSymbol);
      return true;
    });
  }, []);
  const allStocks = useMemo(() => {
    const bySymbol = new Map<string, InstrumentUniverseItem>();
    cedearUnderlyings.forEach((item) => {
      const symbol = item.underlyingSymbol ?? item.symbol;
      bySymbol.set(symbol, {
        ...item,
        symbol,
        category: "equity",
        country: "US",
        displayName: item.displayName.replace(/\s+CEDEAR$/i, ""),
        primarySymbol: item.primarySymbol ?? symbol,
      });
    });
    stocks.forEach((item) => bySymbol.set(item.symbol, item));
    return Array.from(bySymbol.values()).sort((left, right) => left.symbol.localeCompare(right.symbol));
  }, [cedearUnderlyings, stocks]);
  const selected = useMemo(() => {
    const source = view === "etfs" ? etfs : view === "cedearUnderlyings" ? cedearUnderlyings : allStocks;
    const normalized = query.trim().toLowerCase();
    if (!normalized) return source;
    return source.filter((item) => [item.symbol, item.displayName, item.underlyingSymbol, ...(item.searchableAliases ?? [])].some((value) => value?.toLowerCase().includes(normalized)));
  }, [allStocks, cedearUnderlyings, etfs, query, view]);
  const analysisSymbols = useMemo(() => selected.map((item) => item.underlyingSymbol ?? item.primarySymbol ?? item.symbol), [selected]);
  const quotes = useProviderQuotes(analysisSymbols);
  const analyses = useTechnicalAnalyses(analysisSymbols, {
    enabled: ["indicators", "cedearUnderlyings"].includes(view),
    language,
    timeframe: "1Y",
  });
  const orderedSelected = useMemo(() => {
    return sortTableRows(selected, sort, {
      asset: (item) => `${item.underlyingSymbol ?? item.primarySymbol ?? item.symbol} ${item.displayName}`,
      price: (item) => quotes[item.underlyingSymbol ?? item.primarySymbol ?? item.symbol]?.price,
      change: (item) => quotes[item.underlyingSymbol ?? item.primarySymbol ?? item.symbol]?.changePercent,
      score: (item) => analyses[item.underlyingSymbol ?? item.primarySymbol ?? item.symbol]?.technicalScore,
      rsi: (item) => analyses[item.underlyingSymbol ?? item.primarySymbol ?? item.symbol]?.snapshot.rsi14,
      macd: (item) => analyses[item.underlyingSymbol ?? item.primarySymbol ?? item.symbol]?.snapshot.macd,
      reading: (item) => analyses[item.underlyingSymbol ?? item.primarySymbol ?? item.symbol]?.technicalScore,
    });
  }, [analyses, quotes, selected, sort]);
  const pageCount = Math.max(1, Math.ceil(selected.length / pageSize));
  const visible = useMemo(() => orderedSelected.slice((page - 1) * pageSize, page * pageSize), [orderedSelected, page]);

  function updateSort(key: UsaSortKey, initialDirection: "asc" | "desc" = "asc") {
    setSort((current) => nextSortState(current, key, initialDirection));
    setPage(1);
  }

  function changeView(next: View) {
    setView(next);
    setPage(1);
    setQuery("");
    setSort({ key: "asset", direction: "asc" });
  }

  const labels: Record<View, string> = {
    overview: isSpanish ? "Panorama" : "Overview",
    stocks: isSpanish ? "Acciones" : "Stocks",
    indicators: isSpanish ? "Acciones + indicadores" : "Stocks + indicators",
    cedearUnderlyings: isSpanish ? "Subyacentes CEDEAR" : "CEDEAR underlyings",
    etfs: "ETFs",
  };

  return (
    <AppShell>
      <div className="space-y-6 py-6">
        <section className="cma-panel-elevated p-5 sm:p-6">
          <p className="cma-kicker">Wall Street</p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><h1 className="text-3xl font-semibold text-white sm:text-4xl">{isSpanish ? "Mercado USA" : "USA market"}</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{isSpanish ? "Acciones, ETFs e indicadores tecnicos en una vista comparable y paginada." : "Stocks, ETFs and technical indicators in a comparable, paginated view."}</p></div>
          </div>
        </section>

        <nav className="flex gap-2 overflow-x-auto rounded-lg border border-white/10 bg-slate-950/55 p-2" aria-label={isSpanish ? "Vistas USA" : "USA views"}>
          {(Object.keys(labels) as View[]).map((item) => <button key={item} type="button" onClick={() => changeView(item)} className={`min-h-10 shrink-0 rounded-md px-4 text-sm font-semibold transition ${view === item ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:bg-white/[0.07] hover:text-white"}`}>{labels[item]}</button>)}
        </nav>

        {view === "overview" ? <MarketHeatmap defaultSegment="usa" compact showControlsInCompact maxItems={24} /> : (
          <section className="cma-panel overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5"><div><h2 className="text-xl font-semibold text-white">{labels[view]}</h2><p className="mt-1 text-sm text-slate-400">{selected.length} {isSpanish ? "instrumentos" : "instruments"}</p></div><label className="relative w-full sm:max-w-xs"><Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><span className="sr-only">{isSpanish ? "Buscar instrumento" : "Search instrument"}</span><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={isSpanish ? "Buscar simbolo o empresa" : "Search symbol or company"} className="h-10 w-full rounded-md border border-white/10 bg-slate-950/70 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40" /></label></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-white/[0.035] text-xs uppercase text-slate-500"><tr>
                  <SortableTableHeader columnKey="asset" label={isSpanish ? "Activo" : "Asset"} activeKey={sort.key} direction={sort.direction} onSort={(key) => updateSort(key)} />
                  <SortableTableHeader columnKey="price" label={isSpanish ? "Ultimo" : "Last"} activeKey={sort.key} direction={sort.direction} onSort={(key) => updateSort(key, "desc")} />
                  <SortableTableHeader columnKey="change" label={`% ${isSpanish ? "Dia" : "Day"}`} activeKey={sort.key} direction={sort.direction} onSort={(key) => updateSort(key, "desc")} />
                  {["indicators", "cedearUnderlyings"].includes(view) ? <>
                    <SortableTableHeader columnKey="score" label="Score" activeKey={sort.key} direction={sort.direction} onSort={(key) => updateSort(key, "desc")} />
                    <SortableTableHeader columnKey="rsi" label="RSI" activeKey={sort.key} direction={sort.direction} onSort={(key) => updateSort(key, "desc")} />
                    <SortableTableHeader columnKey="macd" label="MACD" activeKey={sort.key} direction={sort.direction} onSort={(key) => updateSort(key, "desc")} />
                    <SortableTableHeader columnKey="reading" label={isSpanish ? "Lectura" : "Reading"} activeKey={sort.key} direction={sort.direction} onSort={(key) => updateSort(key, "desc")} />
                  </> : null}
                  <th className="px-4 py-3 text-right">{isSpanish ? "Analisis" : "Analysis"}</th>
                </tr></thead>
                <tbody>{visible.map((instrument: InstrumentUniverseItem) => {
                  const analysisSymbol = instrument.underlyingSymbol ?? instrument.primarySymbol ?? instrument.symbol;
                  const quote = quotes[analysisSymbol];
                  const analysis = analyses[analysisSymbol];
                  const score = analysis?.technicalScore;
                  const showsIndicators = ["indicators", "cedearUnderlyings"].includes(view);
                  return <tr key={`${instrument.symbol}-${analysisSymbol}`} className="border-t border-white/10 hover:bg-cyan-300/[0.045]"><td className="px-4 py-3"><span className="flex items-center gap-3"><AssetLogo symbol={analysisSymbol} name={instrument.displayName} type={instrument.category} size="sm" /><span><span className="block font-semibold text-white">{analysisSymbol}</span><span className="block max-w-64 truncate text-xs text-slate-400">{instrument.displayName}</span></span></span></td><td className="px-4 py-3 font-medium text-slate-100">{typeof quote?.price === "number" ? formatCurrencyValue(quote.price, quote.currency, language) : "-"}</td><td className={`px-4 py-3 font-semibold ${typeof quote?.changePercent === "number" ? quote.changePercent >= 0 ? "text-emerald-300" : "text-rose-300" : "text-slate-500"}`}>{typeof quote?.changePercent === "number" ? formatPercent(quote.changePercent) : "-"}</td>{showsIndicators ? <><td className="px-4 py-3"><span className={`rounded-md px-2 py-1 text-xs font-semibold ${tone(score)}`}>{analysis === undefined ? "..." : score ?? "-"}</span></td><td className="px-4 py-3"><span className={`rounded-md px-2 py-1 text-xs font-semibold ${rsiTone(analysis?.snapshot.rsi14)}`}>{analysis === undefined ? "..." : analysis?.snapshot.rsi14?.toFixed(1) ?? "-"}</span></td><td className="px-4 py-3"><span className={`rounded-md px-2 py-1 text-xs font-semibold ${macdTone(analysis)}`}>{analysis === undefined ? "..." : analysis?.snapshot.macd?.toFixed(2) ?? "-"}</span></td><td className="px-4 py-3"><span className={`rounded-md px-2 py-1 text-xs font-semibold ${tone(score)}`}>{analysis === undefined ? "..." : typeof score === "number" ? score >= 65 ? (isSpanish ? "Compra" : "Buy") : score <= 35 ? (isSpanish ? "Venta" : "Sell") : (isSpanish ? "Esperar" : "Wait") : (isSpanish ? "Sin analisis" : "No analysis")}</span></td></> : null}<td className="px-4 py-3 text-right"><Link href={`/asset/${encodeURIComponent(analysisSymbol)}`} className="font-semibold text-cyan-200 hover:text-white">{isSpanish ? "Abrir" : "Open"}</Link></td></tr>;
                })}</tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-4"><button type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 disabled:opacity-35">{isSpanish ? "Anterior" : "Previous"}</button><button type="button" disabled={page === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 disabled:opacity-35">{isSpanish ? "Siguiente" : "Next"}</button></div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
