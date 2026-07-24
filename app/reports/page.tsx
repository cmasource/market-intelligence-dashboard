"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FixedIncomeComparison } from "@/components/fixed-income/FixedIncomeComparison";
import { AppShell } from "@/components/layout/AppShell";
import { NewsList } from "@/components/news/NewsList";
import type { NewsArticle } from "@/lib/news";
import { useLanguage } from "@/lib/i18n/useLanguage";

type EarningsEvent = {
  date?: string;
  epsActual?: number | null;
  epsEstimate?: number | null;
  hour?: string;
  quarter?: number;
  revenueEstimate?: number | null;
  symbol?: string;
  year?: number;
};

type EconomicEvent = {
  actual?: number | string | null;
  country?: string;
  estimate?: number | string | null;
  event?: string;
  impact?: string;
  prev?: number | string | null;
  time?: string;
  unit?: string;
};

type ProviderListResponse<T> = {
  events?: T[];
  articles?: NewsArticle[];
  sourceLabel?: string;
  error?: string;
};

function formatDate(value?: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("es-AR", { month: "short", day: "2-digit" });
}

function formatCompactNumber(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export default function ReportsPage() {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [earnings, setEarnings] = useState<EarningsEvent[]>([]);
  const [economic, setEconomic] = useState<EconomicEvent[]>([]);
  const [sourceErrors, setSourceErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadResearch() {
      setIsLoading(true);
      const errors: string[] = [];
      try {
        const [newsResponse, earningsResponse, economicResponse] = await Promise.all([
          fetch("/api/news/market", { signal: controller.signal }),
          fetch("/api/research/earnings", { signal: controller.signal }),
          fetch("/api/research/economic-calendar", { signal: controller.signal }),
        ]);

        const [newsData, earningsData, economicData] = await Promise.all([
          newsResponse.json() as Promise<ProviderListResponse<never>>,
          earningsResponse.json() as Promise<ProviderListResponse<EarningsEvent>>,
          economicResponse.json() as Promise<ProviderListResponse<EconomicEvent>>,
        ]);

        if (!newsResponse.ok || newsData.error) errors.push(newsData.error ?? "Market news unavailable");
        const earningsError = earningsResponse.ok ? earningsData.error : "calendar unavailable";
        const economicError = economicResponse.ok ? economicData.error : "calendar unavailable";
        if (earningsError === "Missing FINNHUB_API_KEY" && economicError === "Missing FINNHUB_API_KEY") {
          errors.push("FINNHUB_API_KEY pendiente para calendario de balances y calendario bursatil.");
        } else {
          if (earningsError) errors.push(`Earnings: ${earningsError}`);
          if (economicError) errors.push(`Economic: ${economicError}`);
        }

        setNews((newsData.articles ?? []).filter((article) => article.provider !== "mock"));
        setEarnings((earningsData.events ?? []).slice(0, 10));
        setEconomic((economicData.events ?? []).slice(0, 10));
        setSourceErrors([...new Set(errors)]);
      } catch (error) {
        if (!controller.signal.aborted) {
          setSourceErrors([error instanceof Error ? error.message : "Research data unavailable"]);
          setNews([]);
          setEarnings([]);
          setEconomic([]);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadResearch();
    return () => controller.abort();
  }, []);

  const modules = useMemo(
    () => [
      {
        title: isSpanish ? "Noticias de mercado" : "Market news",
        body: isSpanish ? "RSS/proveedor real, sin titulares inventados." : "Real RSS/provider data, without invented headlines.",
        status: news.length ? "online" : "waiting",
      },
      {
        title: isSpanish ? "Calendario de balances" : "Earnings calendar",
        body: isSpanish ? "Finnhub calendar/earnings para fechas y consenso." : "Finnhub calendar/earnings for dates and consensus.",
        status: earnings.length ? "online" : "waiting",
      },
      {
        title: isSpanish ? "Calendario bursatil" : "Market calendar",
        body: isSpanish ? "Eventos macro via proveedor, sin datos inventados." : "Macro events via provider, without invented data.",
        status: economic.length ? "online" : "waiting",
      },
      {
        title: isSpanish ? "Bonos y calculadora" : "Bonds and calculator",
        body: isSpanish ? "Motor listo; bloqueado para senales hasta conectar precios y flujos reales." : "Engine ready; blocked for signals until real prices and cash flows are connected.",
        status: "blocked",
      },
    ],
    [earnings.length, economic.length, isSpanish, news.length],
  );

  return (
    <AppShell>
      <div className="space-y-6 py-6">
        <section className="cma-panel cma-hero-panel p-6">
          <p className="cma-kicker">Research terminal</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            {isSpanish ? "Research y reportes operativos" : "Operational research and reports"}
          </h1>
          <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-300">
            {isSpanish
              ? "Noticias, calendarios, bonos y validacion de analisis en un solo tablero. Los modulos sin fuente real quedan marcados como no operativos, sin datos inventados."
              : "News, calendars, bonds and analysis validation in one workspace. Modules without a real source are marked as non-operational, without invented data."}
          </p>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {modules.map((module) => (
            <article key={module.title} className="rounded-lg border border-white/10 bg-slate-950/55 p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-sm font-semibold text-white">{module.title}</h2>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${
                    module.status === "online"
                      ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
                      : module.status === "blocked"
                        ? "border-amber-300/25 bg-amber-300/10 text-amber-100"
                        : "border-slate-500/25 bg-slate-500/10 text-slate-300"
                  }`}
                >
                  {module.status === "online" ? "Real" : module.status === "blocked" ? "Bloqueado" : "Sin datos"}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">{module.body}</p>
            </article>
          ))}
        </section>

        {sourceErrors.length ? (
          <section className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
            <p className="font-semibold">{isSpanish ? "Fuentes pendientes" : "Pending sources"}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {sourceErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-white/10 bg-slate-950/55 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="cma-kicker">{isSpanish ? "Noticias" : "News"}</p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  {isSpanish ? "Titulares recientes" : "Recent headlines"}
                </h2>
              </div>
              <Link href="/screener" className="rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-sm font-medium text-cyan-100">
                Screener
              </Link>
            </div>
            <div className="mt-4">
              {isLoading ? (
                <p className="text-sm text-slate-400">{isSpanish ? "Cargando noticias..." : "Loading news..."}</p>
              ) : news.length ? (
                <NewsList articles={news.slice(0, 5)} />
              ) : (
                <p className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400">
                  {isSpanish ? "No hay noticias reales disponibles en este momento." : "No real news are available right now."}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <CalendarPanel
              title={isSpanish ? "Calendario de balances" : "Earnings calendar"}
              rows={earnings.map((event) => ({
                key: `${event.symbol}-${event.date}-${event.quarter}`,
                primary: event.symbol ?? "-",
                secondary: `${formatDate(event.date)} | Q${event.quarter ?? "-"} ${event.year ?? ""}`.trim(),
                meta: `EPS est. ${formatCompactNumber(event.epsEstimate)} | Rev. est. ${formatCompactNumber(event.revenueEstimate)}`,
              }))}
              empty={isSpanish ? "Sin balances reales para el rango consultado." : "No real earnings events for the requested window."}
            />
            <CalendarPanel
              title={isSpanish ? "Calendario bursatil y macro" : "Market and macro calendar"}
              rows={economic.map((event) => ({
                key: `${event.time}-${event.country}-${event.event}`,
                primary: event.event ?? "-",
                secondary: `${formatDate(event.time)} | ${event.country ?? "-"}`,
                meta: `Est. ${event.estimate ?? "-"} | Prev. ${event.prev ?? "-"} | Actual ${event.actual ?? "-"}`,
              }))}
              empty={isSpanish ? "Sin eventos reales para el rango consultado." : "No real events for the requested window."}
            />
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-slate-950/55 p-5">
          <p className="cma-kicker">{isSpanish ? "Validacion de senales" : "Signal validation"}</p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {isSpanish ? "Capacidad tecnica y fundamental" : "Technical and fundamental capability"}
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              {
                label: isSpanish ? "Dashboard original" : "Original dashboard",
                body: isSpanish ? "Base visual y flujos existentes; conserva un universo interno inicial mientras se completa la cobertura real." : "Existing visual base and flows; keeps an internal initial universe while real coverage is completed.",
              },
              {
                label: "Claude",
                body: isSpanish ? "Aporto organizacion de Research, calendarios y calculadora de bonos; varios modulos eran placeholders o dependian de yfinance/Finnhub." : "Added Research organization, calendars and bond calculator; several modules were placeholders or depended on yfinance/Finnhub.",
              },
              {
                label: isSpanish ? "Estado actual" : "Current state",
                body: isSpanish ? "Trade Radar calcula indicadores en backend con proveedor; fundamentales usan Finnhub/FMP/Alpha cuando hay datos. Lo no real queda advertido o bloqueado." : "Trade Radar computes indicators server-side with providers; fundamentals use Finnhub/FMP/Alpha when available. Non-real data is warned or blocked.",
              },
            ].map((item) => (
              <article key={item.label} className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
                <h3 className="text-sm font-semibold text-white">{item.label}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <FixedIncomeComparison />
      </div>
    </AppShell>
  );
}

function CalendarPanel({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: Array<{ key: string; primary: string; secondary: string; meta: string }>;
  empty: string;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-slate-950/55 p-5">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      <div className="mt-4 space-y-2">
        {rows.length ? (
          rows.slice(0, 6).map((row) => (
            <article key={row.key} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-white">{row.primary}</p>
                <p className="text-xs text-slate-500">{row.secondary}</p>
              </div>
              <p className="mt-2 text-xs text-slate-400">{row.meta}</p>
            </article>
          ))
        ) : (
          <p className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400">{empty}</p>
        )}
      </div>
    </section>
  );
}
