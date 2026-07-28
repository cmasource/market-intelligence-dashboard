"use client";

import { getRankingsBundle } from "@/lib/rankings";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { useTheme } from "@/lib/theme/useTheme";
import { PerformanceRankings } from "./PerformanceRankings";
import { RankingColumn } from "./RankingColumn";

type MarketRankingsProps = {
  compact?: boolean;
};

export function MarketRankings({ compact = false }: MarketRankingsProps) {
  const { language } = useLanguage();
  const { resolvedMode } = useTheme();
  const isSpanish = language === "es";
  const isLight = resolvedMode === "light";
  const rankings = getRankingsBundle();

  return (
    <section
      id="rankings"
      className={`cma-panel p-4 sm:p-5 ${isLight ? "bg-white/95" : "bg-slate-950/72"}`}
      data-testid="market-rankings"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="cma-kicker">{isSpanish ? "Lecturas CMA" : "CMA readings"}</p>
          <h2 className={`mt-2 text-xl font-semibold ${isLight ? "text-slate-950" : "text-white"}`}>
            {isSpanish ? "Oportunidades por señal" : "Opportunities by signal"}
          </h2>
          <p className={`mt-2 max-w-3xl text-sm leading-6 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
            {isSpanish
              ? "Listas generadas con datos disponibles de precio, técnico, fundamentos y cobertura. No constituyen recomendación de inversión."
              : "Lists generated with available price, technical, fundamentals and coverage data. They are not investment recommendations."}
          </p>
        </div>
        <span className="rounded-md border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 py-1 text-xs font-medium text-[var(--cma-text-muted)]">
          {isSpanish ? "No constituye recomendación de inversión" : "Not an investment recommendation"}
        </span>
      </div>

      <div className="mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 xl:grid xl:grid-cols-3 xl:overflow-visible xl:pb-0">
        <RankingColumn
          title={isSpanish ? "Ranking técnico" : "Technical ranking"}
          subtitle={
            isSpanish
              ? "Ordenado por lectura técnica disponible. No constituye recomendación de inversión."
              : "Ordered by available technical reading. Not an investment recommendation."
          }
          items={rankings.technical.items.slice(0, 5)}
          accent="technical"
          compact={compact}
          ctaLabel={isSpanish ? "Abrir análisis" : "Open analysis"}
        />
        <RankingColumn
          title={isSpanish ? "Ranking fundamental" : "Fundamental ranking"}
          subtitle={
            isSpanish
              ? "Ordenado por calidad fundamental estimada con los datos disponibles."
              : "Ordered by estimated fundamental quality with available data."
          }
          items={rankings.fundamental.items.slice(0, 5)}
          accent="fundamental"
          compact={compact}
          ctaLabel={isSpanish ? "Abrir análisis" : "Open analysis"}
        />
        <RankingColumn
          title={isSpanish ? "Ranking combinado" : "Combined ranking"}
          subtitle={
            isSpanish
              ? "Combina lectura técnica, fundamentos y calidad de datos disponibles."
              : "Combines technical reading, fundamentals and available data quality."
          }
          items={rankings.combined.items.slice(0, 5)}
          accent="combined"
          compact={compact}
          ctaLabel={isSpanish ? "Abrir análisis" : "Open analysis"}
        />
      </div>

      {!compact ? <div className="mt-4">
        <PerformanceRankings rankings={rankings.performance} isSpanish={isSpanish} />
      </div> : null}
    </section>
  );
}
