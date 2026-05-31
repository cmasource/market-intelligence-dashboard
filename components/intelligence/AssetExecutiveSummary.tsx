"use client";

import { useEffect, useState } from "react";
import { formatScore } from "@/lib/formatters";
import { useLanguage } from "@/lib/i18n/useLanguage";
import type { AssetIntelligenceReport } from "@/lib/intelligence";

type AssetExecutiveSummaryProps = {
  symbol: string;
};

function firstSentence(text: string) {
  return text.split(/(?<=[.!?])\s+/)[0]?.trim() || text;
}

export function AssetExecutiveSummary({ symbol }: AssetExecutiveSummaryProps) {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const [report, setReport] = useState<AssetIntelligenceReport | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(`/api/intelligence/${encodeURIComponent(symbol)}?language=${language}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Intelligence request failed.");
        if (!controller.signal.aborted) setReport((await response.json()) as AssetIntelligenceReport);
      } catch {
        if (!controller.signal.aborted) setReport(null);
      }
    }

    void load();
    return () => controller.abort();
  }, [language, symbol]);

  if (!report) {
    return (
      <section className="cma-panel p-4">
        <p className="text-sm text-slate-400">
          {isSpanish ? "Preparando lectura ejecutiva..." : "Preparing executive reading..."}
        </p>
      </section>
    );
  }

  const score = report.marketSignalSummary.score;

  return (
    <section className="cma-panel-elevated cma-glow-cyan p-4 sm:p-5" data-testid="asset-executive-summary">
      <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
              {isSpanish ? "Senal integrada" : "Integrated signal"}
            </p>
            <p className="mt-1 text-2xl font-semibold text-white">{report.marketSignalSummary.label}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {isSpanish ? "Confianza" : "Confidence"}
            </p>
            <p className="mt-1 text-lg font-semibold text-white">{report.marketSignalSummary.confidence}</p>
          </div>
          <div className="rounded-2xl border border-violet-300/25 bg-violet-300/10 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200">
              {isSpanish ? "Score" : "Score"}
            </p>
            <p className="mt-1 text-lg font-semibold text-white">
              {score === null ? "N/A" : `${formatScore(score)}/100`}
            </p>
          </div>
        </div>
        <div>
          <p className="cma-kicker">{isSpanish ? "Lectura ejecutiva" : "Executive reading"}</p>
          <p className="mt-2 text-base leading-7 text-slate-200">
            {firstSentence(report.finalReading.summary)}
          </p>
        </div>
      </div>
    </section>
  );
}

