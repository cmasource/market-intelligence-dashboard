"use client";

import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/useLanguage";
import type { Asset } from "@/types/asset";
import { AssetSearch } from "./AssetSearch";

type DashboardWelcomeProps = {
  assets: Asset[];
};

type TickerItem = {
  id: string;
  label: string;
  value: number | null;
  changePercent: number | null;
  currency: string;
};

type TickerResponse = {
  items?: TickerItem[];
  fetchedAt?: string;
};

const preferredMetrics = ["merval", "sp500", "usd-bolsa", "nasdaq"];

function formatMetric(item: TickerItem, language: "en" | "es") {
  if (typeof item.value !== "number") return "N/D";
  return new Intl.NumberFormat(language === "es" ? "es-AR" : "en-US", {
    maximumFractionDigits: item.value >= 1000 ? 0 : 2,
  }).format(item.value);
}

export function DashboardWelcome({ assets }: DashboardWelcomeProps) {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const [items, setItems] = useState<TickerItem[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMetrics() {
      try {
        const response = await fetch("/api/market-ticker", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = response.ok ? (await response.json()) as TickerResponse : null;
        if (!controller.signal.aborted) {
          setItems(payload?.items ?? []);
          setFetchedAt(payload?.fetchedAt ?? null);
        }
      } catch {
        if (!controller.signal.aborted) setItems([]);
      }
    }

    void loadMetrics();
    const interval = window.setInterval(loadMetrics, 60_000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void loadMetrics();
    };
    window.addEventListener("focus", loadMetrics);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", loadMetrics);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const metrics = useMemo(() => {
    const byId = new Map(items.map((item) => [item.id, item]));
    return preferredMetrics.map((id) => byId.get(id) ?? null);
  }, [items]);

  return (
    <section className="cma-welcome-panel cma-panel p-5 sm:p-7 lg:p-8" aria-labelledby="dashboard-welcome-title">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(30rem,1.1fr)] xl:gap-9">
        <div className="cma-welcome-enter flex min-w-0 flex-col justify-center">
          <h1 id="dashboard-welcome-title" className="text-4xl font-semibold text-[var(--cma-text-primary)] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
            CMA Markets
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-7 text-[var(--cma-text-secondary)] sm:text-xl sm:leading-8">
            {isSpanish
              ? "Inteligencia financiera para entender el mercado antes de tomar una decisión."
              : "Financial intelligence to understand the market before making a decision."}
          </p>
          <span className="mt-5 h-0.5 w-14 rounded-full bg-[var(--cma-accent-cyan)]" aria-hidden="true" />
          <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--cma-text-muted)]">
            {isSpanish
              ? "Cotizaciones, análisis técnico, fundamentos y contexto argentino en una lectura integrada."
              : "Quotes, technical analysis, fundamentals and Argentine context in one integrated view."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/argentina" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--cma-accent-cyan)] px-4 py-2 text-sm font-semibold text-[#061413] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cma-accent-cyan)]">
              {isSpanish ? "Explorar Argentina" : "Explore Argentina"}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/trade-radar" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--cma-text-primary)] transition hover:border-[var(--cma-border-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cma-accent-cyan)]">
              {isSpanish ? "Abrir Trade Radar" : "Open Trade Radar"}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="cma-welcome-enter cma-welcome-enter-delay min-w-0 border-t border-[var(--cma-border-soft)] pt-6 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-[var(--cma-text-secondary)]">
              {isSpanish ? "Mercados ahora" : "Markets now"}
            </h2>
            <span
              className="inline-flex shrink-0 items-center gap-1.5 text-xs text-[var(--cma-accent-cyan)]"
              aria-label={isSpanish ? "Datos con actualización continua" : "Continuously updated data"}
            >
              <Clock3 size={13} aria-hidden="true" />
              <span className="hidden sm:inline">
                {fetchedAt
                  ? `${isSpanish ? "Actualizado" : "Updated"} ${new Intl.DateTimeFormat(isSpanish ? "es-AR" : "en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                      timeZone: "America/Argentina/Buenos_Aires",
                    }).format(new Date(fetchedAt))}`
                  : isSpanish ? "Actualizando" : "Updating"}
              </span>
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 xl:block" aria-live="polite">
            {metrics.map((item, index) => {
              const change = item?.changePercent;
              const positive = typeof change === "number" && change >= 0;
              return (
                <div
                  key={item?.id ?? `metric-loading-${index}`}
                  className="flex min-h-[4.5rem] min-w-0 flex-col justify-center gap-1.5 border-b border-[var(--cma-border-soft)] p-2.5 odd:border-r xl:grid xl:min-h-[3.75rem] xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center xl:gap-4 xl:border-r-0 xl:px-0 xl:py-2.5"
                >
                  {item ? (
                    <>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-medium text-[var(--cma-text-secondary)]">{item.label}</span>
                        <span className="mt-0.5 block text-[10px] uppercase text-[var(--cma-text-muted)]">{item.currency}</span>
                      </span>
                      <span className="flex min-w-0 items-baseline justify-between gap-1.5 text-right xl:justify-end xl:gap-4">
                        <strong className="cma-metric min-w-0 text-base font-semibold text-[var(--cma-text-primary)] sm:text-xl xl:text-2xl">{formatMetric(item, language)}</strong>
                        <span className={`shrink-0 text-right text-[10px] font-semibold sm:text-xs xl:w-16 ${typeof change !== "number" ? "text-[var(--cma-text-muted)]" : positive ? "text-[var(--cma-positive)]" : "text-[var(--cma-negative)]"}`}>
                          {typeof change === "number" ? `${change > 0 ? "+" : ""}${change.toFixed(2)}%` : "N/D"}
                        </span>
                      </span>
                    </>
                  ) : (
                    <span className="col-span-2 h-5 w-full animate-pulse rounded bg-[var(--cma-bg-elevated)]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="cma-welcome-enter cma-welcome-enter-search mt-7">
        <AssetSearch assets={assets} variant="hero" />
      </div>
    </section>
  );
}
