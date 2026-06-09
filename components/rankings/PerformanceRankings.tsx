"use client";

import { useState } from "react";
import type { PerformancePeriod, RankingResponse } from "@/lib/rankings";
import { RankingRow } from "./RankingRow";

type PerformanceRankingsProps = {
  rankings: Record<PerformancePeriod, RankingResponse>;
  isSpanish: boolean;
};

const periods: PerformancePeriod[] = ["30D", "180D", "YTD"];

function periodLabel(period: PerformancePeriod, isSpanish: boolean) {
  if (period === "30D") return isSpanish ? "Últimos 30 días" : "Last 30 days";
  if (period === "180D") return isSpanish ? "Últimos 180 días" : "Last 180 days";
  return isSpanish ? "Año en curso" : "Year to date";
}

export function PerformanceRankings({ rankings, isSpanish }: PerformanceRankingsProps) {
  const [activePeriod, setActivePeriod] = useState<PerformancePeriod>("30D");
  const activeRanking = rankings[activePeriod];

  return (
    <article className="overflow-hidden rounded-lg border border-white/10 bg-slate-950/55 shadow-2xl shadow-black/10">
      <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-emerald-200">{isSpanish ? "Mejores rendimientos" : "Best performers"}</h3>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            {isSpanish
              ? "Rendimientos estimados con histórico disponible o fallback identificado."
              : "Estimated returns from available history or identified fallback data."}
          </p>
        </div>
        <div className="flex rounded-full border border-white/10 bg-white/[0.035] p-1">
          {periods.map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setActivePeriod(period)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                activePeriod === period ? "bg-emerald-300/14 text-emerald-100" : "text-slate-400 hover:text-white"
              }`}
            >
              {periodLabel(period, isSpanish)}
            </button>
          ))}
        </div>
      </div>
      <div>
        {activeRanking.items.map((item, index) => (
          <RankingRow
            key={`${activePeriod}-${item.symbol}`}
            item={item}
            rank={index + 1}
            accent="performance"
            ctaLabel={isSpanish ? "Abrir análisis" : "Open analysis"}
          />
        ))}
      </div>
    </article>
  );
}
