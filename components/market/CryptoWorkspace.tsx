"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AssetLogo } from "@/components/assets/AssetLogo";
import { SortableTableHeader } from "@/components/ui/SortableTableHeader";
import type { TechnicalAnalysisResponse } from "@/lib/analysis/types";
import { formatCurrencyValue, formatPercent } from "@/lib/formatters";
import { useProviderQuotes } from "@/lib/hooks/useProviderQuotes";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { instrumentUniverse } from "@/lib/instrument-universe";
import { nextSortState, sortTableRows, type SortState } from "@/lib/ui/sortable-table";

const pageSize = 10;
type CryptoSortKey = "asset" | "price" | "change" | "score" | "rsi" | "macd" | "reading";

function signal(score: number | undefined, isSpanish: boolean) {
  if (typeof score !== "number") return isSpanish ? "Sin analisis" : "No analysis";
  if (score >= 65) return isSpanish ? "Compra" : "Buy";
  if (score <= 35) return isSpanish ? "Venta" : "Sell";
  return isSpanish ? "Esperar" : "Wait";
}

function scoreTone(score: number | undefined) {
  if (typeof score !== "number") return "text-slate-400";
  if (score >= 65) return "bg-emerald-300/12 text-emerald-300 ring-1 ring-emerald-300/25";
  if (score <= 35) return "bg-rose-300/12 text-rose-300 ring-1 ring-rose-300/25";
  return "bg-amber-300/10 text-amber-200 ring-1 ring-amber-300/20";
}

export function CryptoWorkspace() {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState<CryptoSortKey>>({ key: "asset", direction: "asc" });
  const [analyses, setAnalyses] = useState<Record<string, TechnicalAnalysisResponse | null>>({});
  const instruments = useMemo(() => instrumentUniverse.filter((item) => item.category === "crypto" && item.isSearchable), []);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? instruments.filter((item) => [item.symbol, item.displayName, ...(item.searchableAliases ?? [])].some((value) => value?.toLowerCase().includes(normalized))) : instruments;
  }, [instruments, query]);
  const orderedFiltered = useMemo(() => {
    if (sort.key !== "asset") return filtered;
    return sortTableRows(filtered, sort, {
      asset: (item) => `${item.symbol} ${item.displayName}`,
      price: () => null,
      change: () => null,
      score: () => null,
      rsi: () => null,
      macd: () => null,
      reading: () => null,
    });
  }, [filtered, sort]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = useMemo(() => orderedFiltered.slice((page - 1) * pageSize, page * pageSize), [orderedFiltered, page]);
  const symbols = useMemo(() => pageItems.map((item) => item.symbol), [pageItems]);
  const quotes = useProviderQuotes(symbols);
  const visible = useMemo(() => sort.key === "asset" ? pageItems : sortTableRows(pageItems, sort, {
    asset: (item) => `${item.symbol} ${item.displayName}`,
    price: (item) => quotes[item.symbol]?.price,
    change: (item) => quotes[item.symbol]?.changePercent,
    score: (item) => analyses[item.symbol]?.technicalScore,
    rsi: (item) => analyses[item.symbol]?.snapshot.rsi14,
    macd: (item) => analyses[item.symbol]?.snapshot.macd,
    reading: (item) => analyses[item.symbol]?.technicalScore,
  }), [analyses, pageItems, quotes, sort]);

  useEffect(() => {
    if (!symbols.length) return;
    const controller = new AbortController();
    Promise.allSettled(symbols.map(async (symbol) => {
      const response = await fetch(`/api/analysis/technical/${encodeURIComponent(symbol)}?timeframe=1Y&language=${language}`, { signal: controller.signal });
      if (!response.ok) return [symbol, null] as const;
      const analysis = (await response.json()) as TechnicalAnalysisResponse;
      return [symbol, analysis.candlesCount > 0 && !analysis.isFallback ? analysis : null] as const;
    })).then((results) => {
      if (controller.signal.aborted) return;
      setAnalyses(results.reduce<Record<string, TechnicalAnalysisResponse | null>>((output, result) => {
        if (result.status === "fulfilled") output[result.value[0]] = result.value[1];
        return output;
      }, Object.fromEntries(symbols.map((symbol) => [symbol, null]))));
    });
    return () => controller.abort();
  }, [language, symbols]);

  return (
    <section className="cma-panel overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
        <div><h2 className="text-xl font-semibold text-white">{isSpanish ? "Cripto + indicadores" : "Crypto + indicators"}</h2><p className="mt-1 text-sm text-slate-400">{filtered.length} {isSpanish ? "pares con cotizacion y lectura tecnica" : "pairs with quotes and technical readings"}</p></div>
        <label className="relative w-full sm:max-w-xs"><Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><span className="sr-only">{isSpanish ? "Buscar criptoactivo" : "Search crypto asset"}</span><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={isSpanish ? "Buscar BTC, Solana..." : "Search BTC, Solana..."} className="h-10 w-full rounded-md border border-white/10 bg-slate-950/70 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-orange-300/40" /></label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-white/[0.035] text-xs uppercase text-slate-500"><tr>
            <SortableTableHeader columnKey="asset" label={isSpanish ? "Activo" : "Asset"} activeKey={sort.key} direction={sort.direction} onSort={(key) => setSort((current) => nextSortState(current, key))} />
            <SortableTableHeader columnKey="price" label={isSpanish ? "Ultimo" : "Last"} activeKey={sort.key} direction={sort.direction} onSort={(key) => setSort((current) => nextSortState(current, key, "desc"))} />
            <SortableTableHeader columnKey="change" label={`% ${isSpanish ? "Dia" : "Day"}`} activeKey={sort.key} direction={sort.direction} onSort={(key) => setSort((current) => nextSortState(current, key, "desc"))} />
            <SortableTableHeader columnKey="score" label="Score" activeKey={sort.key} direction={sort.direction} onSort={(key) => setSort((current) => nextSortState(current, key, "desc"))} />
            <SortableTableHeader columnKey="rsi" label="RSI" activeKey={sort.key} direction={sort.direction} onSort={(key) => setSort((current) => nextSortState(current, key, "desc"))} />
            <SortableTableHeader columnKey="macd" label="MACD" activeKey={sort.key} direction={sort.direction} onSort={(key) => setSort((current) => nextSortState(current, key, "desc"))} />
            <SortableTableHeader columnKey="reading" label={isSpanish ? "Lectura" : "Reading"} activeKey={sort.key} direction={sort.direction} onSort={(key) => setSort((current) => nextSortState(current, key, "desc"))} />
            <th className="px-4 py-3 text-right">{isSpanish ? "Grafico" : "Chart"}</th>
          </tr></thead>
          <tbody>{visible.map((item) => {
            const quote = quotes[item.symbol];
            const analysis = analyses[item.symbol];
            return <tr key={item.symbol} className="border-t border-white/10 transition hover:bg-orange-300/[0.045]"><td className="px-4 py-3"><span className="flex items-center gap-3"><AssetLogo symbol={item.symbol} name={item.displayName} type="crypto" size="sm" /><span><span className="block font-semibold text-white">{item.symbol.replace("-USD", "")}</span><span className="text-xs text-slate-400">{item.displayName}</span></span></span></td><td className="px-4 py-3 font-semibold text-slate-100">{typeof quote?.price === "number" ? formatCurrencyValue(quote.price, quote.currency, language) : "-"}</td><td className={`px-4 py-3 font-semibold ${typeof quote?.changePercent === "number" ? quote.changePercent >= 0 ? "text-emerald-300" : "text-rose-300" : "text-slate-500"}`}>{typeof quote?.changePercent === "number" ? formatPercent(quote.changePercent) : "-"}</td><td className="px-4 py-3"><span className={`rounded-md px-2 py-1 text-xs font-semibold ${scoreTone(analysis?.technicalScore)}`}>{analysis === undefined ? "..." : analysis?.technicalScore ?? "-"}</span></td><td className="px-4 py-3 text-slate-300">{analysis === undefined ? "..." : analysis?.snapshot.rsi14?.toFixed(1) ?? "-"}</td><td className="px-4 py-3 text-slate-300">{analysis === undefined ? "..." : analysis?.snapshot.macd?.toFixed(3) ?? "-"}</td><td className="px-4 py-3"><span className={`rounded-md px-2 py-1 text-xs font-semibold ${scoreTone(analysis?.technicalScore)}`}>{analysis === undefined ? "..." : signal(analysis?.technicalScore, isSpanish)}</span></td><td className="px-4 py-3 text-right"><Link href={`/asset/${encodeURIComponent(item.symbol)}`} className="font-semibold text-cyan-200 hover:text-white">{isSpanish ? "Abrir" : "Open"}</Link></td></tr>;
          })}</tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-white/10 px-4 py-4"><button type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 disabled:opacity-35">{isSpanish ? "Anterior" : "Previous"}</button><span className="text-sm text-slate-500">{page} / {pageCount}</span><button type="button" disabled={page === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 disabled:opacity-35">{isSpanish ? "Siguiente" : "Next"}</button></div>
    </section>
  );
}
