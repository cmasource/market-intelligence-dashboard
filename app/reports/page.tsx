"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BondCalculator } from "@/components/calculators/BondCalculator";
import { CedearCalculator } from "@/components/calculators/CedearCalculator";
import { EquityValuationCalculator } from "@/components/calculators/EquityValuationCalculator";
import { FixedIncomeComparison } from "@/components/fixed-income/FixedIncomeComparison";
import { AppShell } from "@/components/layout/AppShell";
import { NewsList } from "@/components/news/NewsList";
import { SortableTableHeader } from "@/components/ui/SortableTableHeader";
import { useLanguage } from "@/lib/i18n/useLanguage";
import type { NewsArticle } from "@/lib/news";
import { nextSortState, sortTableRows, type SortState, type SortValue } from "@/lib/ui/sortable-table";

type ReportView = "news" | "earnings" | "bonds" | "calculators";
type EarningsEvent = { date?: string; epsEstimate?: number | null; quarter?: number; revenueEstimate?: number | null; symbol?: string; year?: number };
type ListResponse<T> = { events?: T[]; articles?: NewsArticle[]; error?: string };
type EventRow = { cells: string[]; sortValues: SortValue[] };

const views: Array<{ key: ReportView; es: string; en: string }> = [
  { key: "news", es: "Noticias", en: "News" },
  { key: "earnings", es: "Calendario de balances", en: "Earnings calendar" },
  { key: "bonds", es: "Analisis de bonos", en: "Bond analysis" },
  { key: "calculators", es: "Calculadoras", en: "Calculators" },
];

function formatDate(value?: string, locale = "es-AR") {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
}

function compact(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value)
    : "-";
}

export default function ReportsPage() {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const [view, setView] = useState<ReportView>("news");
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [earnings, setEarnings] = useState<EarningsEvent[]>([]);
  const [earningsQuery, setEarningsQuery] = useState("");
  const [earningsError, setEarningsError] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    Promise.allSettled([
      fetch("/api/news/market", { signal: controller.signal }).then((response) => response.json() as Promise<ListResponse<never>>),
      fetch("/api/research/earnings", { signal: controller.signal }).then(async (response) => {
        const payload = await response.json() as ListResponse<EarningsEvent>;
        if (!response.ok) throw new Error(payload.error ?? "No se pudo cargar el calendario de balances.");
        return payload;
      }),
    ]).then(([newsResult, earningsResult]) => {
      if (controller.signal.aborted) return;
      if (newsResult.status === "fulfilled") setNews((newsResult.value.articles ?? []).filter((article) => article.provider !== "mock"));
      if (earningsResult.status === "fulfilled") {
        setEarnings(earningsResult.value.events ?? []);
        setEarningsError(undefined);
      } else {
        setEarnings([]);
        setEarningsError(earningsResult.reason instanceof Error ? earningsResult.reason.message : "No se pudo cargar el calendario de balances.");
      }
      setLoading(false);
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const syncView = () => {
      const next = window.location.hash.replace("#", "") as ReportView;
      if (views.some((item) => item.key === next)) setView(next);
    };
    syncView();
    const syncCustomView = (event: Event) => {
      const next = (event as CustomEvent<string>).detail as ReportView;
      if (views.some((item) => item.key === next)) setView(next);
    };
    window.addEventListener("hashchange", syncView);
    window.addEventListener("cma-report-view", syncCustomView);
    return () => {
      window.removeEventListener("hashchange", syncView);
      window.removeEventListener("cma-report-view", syncCustomView);
    };
  }, []);

  const filteredEarnings = useMemo(() => {
    const normalized = earningsQuery.trim().toLowerCase();
    if (!normalized) return earnings;
    return earnings.filter((item) => item.symbol?.toLowerCase().includes(normalized));
  }, [earnings, earningsQuery]);

  function selectView(next: ReportView) {
    setView(next);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${next}`);
  }

  return (
    <AppShell>
      <div className="space-y-6 py-6">
        <section className="cma-panel-elevated p-5 sm:p-6">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{isSpanish ? "Research y herramientas" : "Research and tools"}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            {isSpanish
              ? "Noticias, calendarios, renta fija y calculadoras en un espacio organizado para investigar y comparar."
              : "News, calendars, fixed income and calculators in one organized research workspace."}
          </p>
        </section>

        <nav aria-label={isSpanish ? "Secciones de reportes" : "Report sections"} className="flex gap-2 overflow-x-auto rounded-lg border border-white/10 bg-slate-950/55 p-2">
          {views.map((item) => (
            <button key={item.key} type="button" onClick={() => selectView(item.key)} className={`min-h-10 shrink-0 rounded-md px-4 text-sm font-semibold transition ${view === item.key ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:bg-white/[0.07] hover:text-white"}`}>
              {item[language]}
            </button>
          ))}
        </nav>

        {view === "news" ? (
          <section className="cma-panel p-5 sm:p-6">
            <p className="cma-kicker">{isSpanish ? "Pulso de mercado" : "Market pulse"}</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{isSpanish ? "Titulares recientes" : "Recent headlines"}</h2>
            <div className="mt-5">{loading ? <LoadingText isSpanish={isSpanish} /> : <NewsList articles={news.slice(0, 12)} />}</div>
          </section>
        ) : null}

        {view === "earnings" ? (
          <EventTable
            title={isSpanish ? "Proximos balances" : "Upcoming earnings"}
            columns={[isSpanish ? "Empresa" : "Company", isSpanish ? "Fecha" : "Date", "EPS est.", isSpanish ? "Ingresos est." : "Revenue est."]}
            rows={filteredEarnings.map((item) => ({
              cells: [item.symbol ?? "-", `${formatDate(item.date, isSpanish ? "es-AR" : "en-US")} | Q${item.quarter ?? "-"} ${item.year ?? ""}`, compact(item.epsEstimate), compact(item.revenueEstimate)],
              sortValues: [item.symbol, item.date ? new Date(item.date) : null, item.epsEstimate, item.revenueEstimate],
            }))}
            empty={isSpanish ? "No hay balances para el rango consultado." : "No earnings events for the selected range."}
            search={{ value: earningsQuery, onChange: setEarningsQuery, placeholder: isSpanish ? "Buscar simbolo o empresa" : "Search symbol or company" }}
            loading={loading}
            error={earningsError}
            key={earningsQuery}
            loadingText={isSpanish ? "Cargando próximos balances..." : "Loading upcoming earnings..."}
          />
        ) : null}

        {view === "bonds" ? <FixedIncomeComparison /> : null}

        {view === "calculators" ? <div className="space-y-4"><CedearCalculator /><EquityValuationCalculator /><BondCalculator /></div> : null}
      </div>
    </AppShell>
  );
}

function LoadingText({ isSpanish }: { isSpanish: boolean }) {
  return <p className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-400">{isSpanish ? "Cargando..." : "Loading..."}</p>;
}

function EventTable({ title, columns, rows, empty, search, loading = false, error, loadingText }: { title: string; columns: string[]; rows: EventRow[]; empty: string; search?: { value: string; onChange: (value: string) => void; placeholder: string }; loading?: boolean; error?: string; loadingText?: string }) {
  const [sort, setSort] = useState<SortState<string>>({ key: "1", direction: "asc" });
  const [page, setPage] = useState(0);
  const pageSize = 30;
  const accessors = useMemo(() => Object.fromEntries(columns.map((_, index) => [String(index), (row: EventRow) => row.sortValues[index]])) as Record<string, (row: EventRow) => SortValue>, [columns]);
  const sortedRows = useMemo(() => sortTableRows(rows, sort, accessors), [accessors, rows, sort]);
  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const activePage = Math.min(page, pageCount - 1);
  const visibleRows = sortedRows.slice(activePage * pageSize, (activePage + 1) * pageSize);

  return (
    <section className="cma-panel overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-semibold text-white">{title}</h2><p className="mt-1 text-xs text-slate-500">{rows.length} resultados</p></div>{search ? <label className="relative w-full sm:max-w-xs"><Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><span className="sr-only">{search.placeholder}</span><input type="search" value={search.value} onChange={(event) => search.onChange(event.target.value)} placeholder={search.placeholder} className="h-10 w-full rounded-md border border-white/10 bg-slate-950/70 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40" /></label> : null}</div>
      {loading ? <p className="p-6 text-sm text-slate-400">{loadingText ?? "Loading..."}</p> : error ? <p role="alert" className="p-6 text-sm text-rose-300">{error}</p> : rows.length ? (
        <>
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-white/[0.035] text-xs uppercase text-slate-500"><tr>{columns.map((column, index) => <SortableTableHeader key={column} columnKey={String(index)} label={column} activeKey={sort.key} direction={sort.direction} onSort={(key) => { setPage(0); setSort((current) => nextSortState(current, key, index === 0 ? "asc" : "desc")); }} />)}</tr></thead><tbody>{visibleRows.map((row, index) => <tr key={`${row.cells[0]}-${activePage * pageSize + index}`} className="border-t border-white/10 hover:bg-cyan-300/[0.04]">{row.cells.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`} className={`px-4 py-3 ${cellIndex === 0 ? "font-semibold text-white" : "text-slate-300"}`}>{cell}</td>)}</tr>)}</tbody></table></div>
          <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>Mostrando {activePage * pageSize + 1}-{Math.min((activePage + 1) * pageSize, sortedRows.length)} de {sortedRows.length}</span>
            <div className="flex items-center gap-3">
              <span>Página {activePage + 1} de {pageCount}</span>
              <button type="button" disabled={activePage === 0} onClick={() => setPage((current) => Math.max(0, current - 1))} className="rounded-md border border-white/10 px-3 py-2 font-semibold text-slate-200 transition hover:border-cyan-300/40 disabled:cursor-not-allowed disabled:opacity-40">Anterior</button>
              <button type="button" disabled={activePage >= pageCount - 1} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} className="rounded-md border border-white/10 px-3 py-2 font-semibold text-slate-200 transition hover:border-cyan-300/40 disabled:cursor-not-allowed disabled:opacity-40">Siguiente</button>
            </div>
          </div>
        </>
      ) : <p className="p-6 text-sm text-slate-400">{empty}</p>}
    </section>
  );
}
