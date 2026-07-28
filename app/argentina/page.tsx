"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CaucionesPanel } from "@/components/argentina/CaucionesPanel";
import { FixedIncomeComparison } from "@/components/fixed-income/FixedIncomeComparison";
import { AppShell } from "@/components/layout/AppShell";
import { MarketHeatmap } from "@/components/market/MarketHeatmap";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { formatCurrencyValue, formatPercent } from "@/lib/formatters";
import type { ArgentinaInstrument, ArgentinaQuote } from "@/lib/argentina";
import type { TechnicalAnalysisResponse } from "@/lib/analysis/types";
import type { BondComparisonItem } from "@/lib/fixed-income";

type ViewKey = "heatmap" | "equities" | "indicators" | "cedears" | "cedearIndicators" | "bonds" | "cauciones";

const pageSize = 12;

const views: Array<{ key: ViewKey; es: string; en: string }> = [
  { key: "heatmap", es: "Mapa de calor", en: "Heatmap" },
  { key: "equities", es: "Acciones", en: "Equities" },
  { key: "indicators", es: "Acciones + indicadores", en: "Equities + indicators" },
  { key: "cedears", es: "CEDEARs", en: "CEDEARs" },
  { key: "cedearIndicators", es: "CEDEARs + indicadores", en: "CEDEARs + indicators" },
  { key: "bonds", es: "Bonos", en: "Bonds" },
  { key: "cauciones", es: "Cauciones", en: "Repos" },
];

function instrumentsForView(items: ArgentinaInstrument[], view: ViewKey) {
  if (view === "cedears" || view === "cedearIndicators") return items.filter((item) => item.type === "cedear");
  if (view === "bonds") {
    return items.filter((item) => ["sovereign_bond", "corporate_bond", "treasury_bill", "lecaps"].includes(item.type));
  }
  return items.filter((item) => item.type === "equity");
}

function signalLabel(analysis: TechnicalAnalysisResponse | null | undefined, isSpanish: boolean) {
  if (!analysis) return "-";
  if (analysis.technicalScore >= 65) return isSpanish ? "Compra" : "Buy";
  if (analysis.technicalScore <= 35) return isSpanish ? "Venta" : "Sell";
  return isSpanish ? "Esperar" : "Wait";
}

function scoreTone(score: number | null | undefined) {
  if (typeof score !== "number") return "text-slate-400";
  if (score >= 65) return "bg-emerald-300/12 text-emerald-300 ring-1 ring-emerald-300/25";
  if (score <= 35) return "bg-rose-300/12 text-rose-300 ring-1 ring-rose-300/25";
  return "bg-amber-300/10 text-amber-200 ring-1 ring-amber-300/20";
}

function rsiTone(rsi: number | null | undefined) {
  if (typeof rsi !== "number") return "text-slate-400";
  if (rsi >= 70 || rsi <= 30) return "bg-amber-300/10 text-amber-200 ring-1 ring-amber-300/20";
  if (rsi >= 45 && rsi <= 65) return "bg-emerald-300/12 text-emerald-300 ring-1 ring-emerald-300/25";
  return "bg-slate-300/8 text-slate-300 ring-1 ring-white/10";
}

function macdTone(analysis: TechnicalAnalysisResponse | null | undefined) {
  const macd = analysis?.snapshot.macd;
  const signal = analysis?.snapshot.macdSignal;
  if (typeof macd !== "number" || typeof signal !== "number") return "text-slate-400";
  return macd >= signal
    ? "bg-emerald-300/12 text-emerald-300 ring-1 ring-emerald-300/25"
    : "bg-rose-300/12 text-rose-300 ring-1 ring-rose-300/25";
}

export default function ArgentinaPage() {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const [view, setView] = useState<ViewKey>("heatmap");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [instruments, setInstruments] = useState<ArgentinaInstrument[]>([]);
  const [quotes, setQuotes] = useState<Record<string, ArgentinaQuote>>({});
  const [analyses, setAnalyses] = useState<Record<string, TechnicalAnalysisResponse | null>>({});
  const [fixedIncome, setFixedIncome] = useState<Record<string, BondComparisonItem>>({});
  const [loading, setLoading] = useState(true);

  const filtered = useMemo(() => {
    const source = instrumentsForView(instruments, view);
    const normalized = query.trim().toLowerCase();
    return normalized ? source.filter((item) => [item.symbol, item.displaySymbol, item.name, item.underlyingSymbol].some((value) => value?.toLowerCase().includes(normalized))) : source;
  }, [instruments, query, view]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page]);
  const visibleSymbols = useMemo(() => visible.map((item) => item.symbol), [visible]);

  useEffect(() => {
    fetch("/api/argentina/instruments")
      .then((response) => response.json())
      .then((payload: { instruments?: ArgentinaInstrument[] }) => setInstruments(payload.instruments ?? []))
      .catch(() => setInstruments([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!visibleSymbols.length || view === "heatmap") return;
    const controller = new AbortController();
    fetch(`/api/argentina/quotes?symbols=${visibleSymbols.join(",")}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((payload: { quotes?: Record<string, ArgentinaQuote> }) => setQuotes(payload.quotes ?? {}))
      .catch(() => undefined);
    return () => controller.abort();
  }, [view, visibleSymbols]);

  useEffect(() => {
    if (view !== "bonds") return;
    const controller = new AbortController();
    fetch("/api/fixed-income/comparison", { signal: controller.signal })
      .then((response) => response.json() as Promise<BondComparisonItem[]>)
      .then((items) => setFixedIncome(Object.fromEntries(items.map((item) => [item.symbol, item]))))
      .catch(() => undefined);
    return () => controller.abort();
  }, [view]);

  useEffect(() => {
    if (!["indicators", "cedearIndicators"].includes(view) || !visibleSymbols.length) return;
    const controller = new AbortController();
    Promise.allSettled(
      visibleSymbols.map(async (symbol) => {
        const response = await fetch(`/api/analysis/technical/${encodeURIComponent(symbol)}?timeframe=1Y&language=${language}`, {
          signal: controller.signal,
        });
        return [symbol, (await response.json()) as TechnicalAnalysisResponse] as const;
      }),
    ).then((results) => {
      if (controller.signal.aborted) return;
      const next = results.reduce<Record<string, TechnicalAnalysisResponse | null>>((accumulator, result) => {
        if (result.status === "fulfilled" && typeof result.value[1]?.technicalScore === "number") {
          accumulator[result.value[0]] = result.value[1];
        }
        return accumulator;
      }, Object.fromEntries(visibleSymbols.map((symbol) => [symbol, null])));
      setAnalyses(next);
    });
    return () => controller.abort();
  }, [language, view, visibleSymbols]);

  function selectView(next: ViewKey) {
    setView(next);
    setPage(1);
    setQuery("");
  }

  const showsIndicators = view === "indicators" || view === "cedearIndicators";

  return (
    <AppShell background="argentina">
      <div className="space-y-6 py-6">
        <section className="cma-panel-elevated p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {isSpanish ? "Mercado argentino" : "Argentina market"}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                {isSpanish
                  ? "Acciones, CEDEARs y renta fija en vistas compactas para comparar mercado, indicadores y oportunidades."
                  : "Equities, CEDEARs and fixed income in compact views for comparing markets, indicators and opportunities."}
              </p>
            </div>
          </div>
        </section>

        <nav aria-label={isSpanish ? "Vistas del mercado argentino" : "Argentina market views"} className="flex gap-2 overflow-x-auto rounded-lg border border-white/10 bg-slate-950/55 p-2">
          {views.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => selectView(item.key)}
              className={`min-h-10 shrink-0 rounded-md px-4 text-sm font-semibold transition ${
                view === item.key ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:bg-white/[0.07] hover:text-white"
              }`}
            >
              {isSpanish ? item.es : item.en}
            </button>
          ))}
        </nav>

        {view === "heatmap" ? (
          <MarketHeatmap defaultSegment="argentina" compact showControlsInCompact maxItems={24} />
        ) : view === "cauciones" ? (
          <CaucionesPanel />
        ) : (
          <section className="cma-panel overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
              <div>
                <h2 className="text-xl font-semibold text-white">{views.find((item) => item.key === view)?.[language]}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {isSpanish ? `${filtered.length} instrumentos en el universo` : `${filtered.length} instruments in the universe`}
                </p>
              </div>
              <label className="relative w-full sm:max-w-xs"><Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><span className="sr-only">{isSpanish ? "Buscar especie" : "Search symbol"}</span><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={isSpanish ? "Buscar especie o empresa" : "Search symbol or company"} className="h-10 w-full rounded-md border border-white/10 bg-slate-950/70 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40" /></label>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-white/[0.035] text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">{isSpanish ? "Especie" : "Symbol"}</th>
                    <th className="px-4 py-3">{isSpanish ? "Nombre" : "Name"}</th>
                    <th className="px-4 py-3">{isSpanish ? "Ultimo" : "Last"}</th>
                    <th className="px-4 py-3">% {isSpanish ? "Dia" : "Day"}</th>
                    {showsIndicators ? <th className="px-4 py-3">Score</th> : null}
                    {showsIndicators ? <th className="px-4 py-3">RSI 14</th> : null}
                    {showsIndicators ? <th className="px-4 py-3">MACD</th> : null}
                    {showsIndicators ? <th className="px-4 py-3">{isSpanish ? "Lectura" : "Reading"}</th> : null}
                    {view === "cedears" ? <th className="px-4 py-3">Ratio</th> : null}
                    {view === "bonds" ? <th className="px-4 py-3">{isSpanish ? "Vencimiento" : "Maturity"}</th> : null}
                    {view === "bonds" ? <th className="px-4 py-3">TIR</th> : null}
                    {view === "bonds" ? <th className="px-4 py-3">{isSpanish ? "Paridad" : "Parity"}</th> : null}
                    <th className="px-4 py-3 text-right">{isSpanish ? "Analisis" : "Analysis"}</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((instrument) => {
                    const quote = quotes[instrument.symbol];
                    const analysis = analyses[instrument.symbol];
                    const fixedIncomeItem = fixedIncome[instrument.symbol];
                    const change = quote?.changePercent;
                    return (
                      <tr key={`${instrument.type}-${instrument.symbol}`} className="border-t border-white/10 transition hover:bg-cyan-300/[0.045]">
                        <td className="px-4 py-3 font-semibold text-white">{instrument.displaySymbol}</td>
                        <td className="max-w-64 truncate px-4 py-3 text-slate-300">{instrument.name}</td>
                        <td className="px-4 py-3 font-medium text-slate-100">
                          {typeof quote?.price === "number" ? formatCurrencyValue(quote.price, quote.currency, language) : "-"}
                        </td>
                        <td className={`px-4 py-3 font-semibold ${typeof change === "number" && change >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                          {typeof change === "number" ? formatPercent(change) : "-"}
                        </td>
                        {showsIndicators ? <td className="px-4 py-3"><span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${scoreTone(analysis?.technicalScore)}`}>{analysis === undefined ? "..." : analysis?.technicalScore ?? "-"}</span></td> : null}
                        {showsIndicators ? <td className="px-4 py-3"><span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${rsiTone(analysis?.snapshot.rsi14)}`}>{analysis === undefined ? "..." : analysis?.snapshot.rsi14?.toFixed(1) ?? "-"}</span></td> : null}
                        {showsIndicators ? <td className="px-4 py-3"><span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${macdTone(analysis)}`}>{analysis === undefined ? "..." : analysis?.snapshot.macd?.toFixed(2) ?? "-"}</span></td> : null}
                        {showsIndicators ? <td className="px-4 py-3"><span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${scoreTone(analysis?.technicalScore)}`}>{analysis === undefined ? "..." : signalLabel(analysis, isSpanish)}</span></td> : null}
                        {view === "cedears" ? <td className="px-4 py-3 text-slate-300">{instrument.cedearRatio ? `${instrument.cedearRatio}:1` : "-"}</td> : null}
                        {view === "bonds" ? <td className="px-4 py-3 text-slate-300">{instrument.maturityDate ?? "-"}</td> : null}
                        {view === "bonds" ? <td className="px-4 py-3 font-semibold text-emerald-300">{typeof fixedIncomeItem?.estimatedYTM === "number" ? `${(fixedIncomeItem.estimatedYTM * 100).toFixed(2)}%` : "-"}</td> : null}
                        {view === "bonds" ? <td className="px-4 py-3 text-slate-300">{typeof fixedIncomeItem?.parity === "number" ? `${(fixedIncomeItem.parity * 100).toFixed(2)}%` : "-"}</td> : null}
                        <td className="px-4 py-3 text-right">
                          <Link href={`/asset/${encodeURIComponent(instrument.symbol)}`} className="font-semibold text-cyan-200 hover:text-white">
                            {isSpanish ? "Abrir" : "Open"}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!loading && visible.length === 0 ? (
              <p className="p-6 text-sm text-slate-400">{isSpanish ? "No hay instrumentos para esta vista." : "No instruments in this view."}</p>
            ) : null}

            <div className="flex items-center justify-between border-t border-white/10 px-4 py-4 sm:px-5">
              <button type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 disabled:opacity-35">
                {isSpanish ? "Anterior" : "Previous"}
              </button>
              <span className="text-sm text-slate-400">{page} / {pageCount}</span>
              <button type="button" disabled={page === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 disabled:opacity-35">
                {isSpanish ? "Siguiente" : "Next"}
              </button>
            </div>
          </section>
        )}
        {view === "bonds" ? <FixedIncomeComparison /> : null}
      </div>
    </AppShell>
  );
}
