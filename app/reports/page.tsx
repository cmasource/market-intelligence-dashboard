"use client";

import { useEffect, useState } from "react";
import { BondCalculator } from "@/components/calculators/BondCalculator";
import { CedearCalculator } from "@/components/calculators/CedearCalculator";
import { FixedIncomeComparison } from "@/components/fixed-income/FixedIncomeComparison";
import { AppShell } from "@/components/layout/AppShell";
import { NewsList } from "@/components/news/NewsList";
import { useLanguage } from "@/lib/i18n/useLanguage";
import type { NewsArticle } from "@/lib/news";

type ReportView = "news" | "earnings" | "bonds" | "calculators";
type EarningsEvent = { date?: string; epsEstimate?: number | null; quarter?: number; revenueEstimate?: number | null; symbol?: string; year?: number };
type ListResponse<T> = { events?: T[]; articles?: NewsArticle[] };

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    Promise.allSettled([
      fetch("/api/news/market", { signal: controller.signal }).then((response) => response.json() as Promise<ListResponse<never>>),
      fetch("/api/research/earnings", { signal: controller.signal }).then((response) => response.json() as Promise<ListResponse<EarningsEvent>>),
    ]).then(([newsResult, earningsResult]) => {
      if (controller.signal.aborted) return;
      if (newsResult.status === "fulfilled") setNews((newsResult.value.articles ?? []).filter((article) => article.provider !== "mock"));
      if (earningsResult.status === "fulfilled") setEarnings(earningsResult.value.events ?? []);
      setLoading(false);
    });
    return () => controller.abort();
  }, []);

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
            <button key={item.key} type="button" onClick={() => setView(item.key)} className={`min-h-10 shrink-0 rounded-md px-4 text-sm font-semibold transition ${view === item.key ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:bg-white/[0.07] hover:text-white"}`}>
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
            rows={earnings.map((item) => [item.symbol ?? "-", `${formatDate(item.date, isSpanish ? "es-AR" : "en-US")} | Q${item.quarter ?? "-"} ${item.year ?? ""}`, compact(item.epsEstimate), compact(item.revenueEstimate)])}
            empty={isSpanish ? "No hay balances para el rango consultado." : "No earnings events for the selected range."}
          />
        ) : null}

        {view === "bonds" ? <FixedIncomeComparison /> : null}

        {view === "calculators" ? <div className="space-y-4"><CedearCalculator /><BondCalculator /></div> : null}
      </div>
    </AppShell>
  );
}

function LoadingText({ isSpanish }: { isSpanish: boolean }) {
  return <p className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-400">{isSpanish ? "Cargando..." : "Loading..."}</p>;
}

function EventTable({ title, columns, rows, empty }: { title: string; columns: string[]; rows: string[][]; empty: string }) {
  return (
    <section className="cma-panel overflow-hidden">
      <div className="border-b border-white/10 px-5 py-4"><h2 className="text-xl font-semibold text-white">{title}</h2></div>
      {rows.length ? (
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-white/[0.035] text-xs uppercase text-slate-500"><tr>{columns.map((column) => <th key={column} className="px-4 py-3">{column}</th>)}</tr></thead><tbody>{rows.slice(0, 30).map((row, index) => <tr key={`${row[0]}-${index}`} className="border-t border-white/10 hover:bg-cyan-300/[0.04]">{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`} className={`px-4 py-3 ${cellIndex === 0 ? "font-semibold text-white" : "text-slate-300"}`}>{cell}</td>)}</tr>)}</tbody></table></div>
      ) : <p className="p-6 text-sm text-slate-400">{empty}</p>}
    </section>
  );
}
