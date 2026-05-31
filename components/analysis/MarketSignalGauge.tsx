"use client";

import { calculateMarketSignalScore } from "@/lib/analysis/market-signal";
import { formatScore } from "@/lib/formatters";
import { useLanguage } from "@/lib/i18n/useLanguage";

type MarketSignalGaugeProps = {
  technicalScore?: number | null;
  fundamentalScore?: number | null;
  fixedIncomeScore?: number | null;
  assetType?: string | null;
  riskLevel?: string | null;
  compact?: boolean;
};

function componentValue(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? `${formatScore(value)}/100` : "N/A";
}

export function MarketSignalGauge({
  technicalScore,
  fundamentalScore,
  fixedIncomeScore,
  assetType,
  riskLevel,
  compact = false,
}: MarketSignalGaugeProps) {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const signal = calculateMarketSignalScore({
    technicalScore,
    fundamentalScore,
    fixedIncomeScore,
    assetType,
    riskLevel,
    language,
  });
  const pointer = signal.score ?? 0;
  const showFixedIncome = assetType?.includes("bond") || fixedIncomeScore !== undefined;

  return (
    <section
      className="cma-panel-elevated cma-glow-violet border-indigo-300/25 p-5 shadow-xl shadow-indigo-950/15"
      data-testid="market-signal-module"
    >
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_180px] md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">
            {isSpanish ? "Senal de mercado" : "Market signal"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{signal.label}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{signal.description}</p>
        </div>
        <div className="mx-auto">
          <div
            className="relative grid h-40 w-40 place-items-center rounded-full border border-white/10 bg-slate-950/60 shadow-2xl shadow-indigo-950/25"
            style={{
              background: `conic-gradient(from -120deg, rgba(251,113,133,.88) 0deg, rgba(251,191,36,.9) 82deg, rgba(148,163,184,.72) 150deg, rgba(34,211,238,.9) 225deg, rgba(52,211,153,.95) ${Math.max(12, (pointer / 100) * 300)}deg, rgba(15,23,42,.78) ${Math.max(12, (pointer / 100) * 300)}deg 360deg)`,
            }}
          >
            <div className="grid h-28 w-28 place-items-center rounded-full border border-white/10 bg-slate-950/92 text-center">
              <div>
                <p className="text-3xl font-semibold text-white">
                  {signal.score === null ? "N/A" : formatScore(signal.score)}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-500">/100</p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-slate-400">
            {isSpanish ? "Confianza" : "Confidence"}: {signal.confidenceLabel}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-cyan-300/15 bg-cyan-300/10 p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-cyan-200">{isSpanish ? "Tecnico" : "Technical"}</p>
          <p className="mt-2 font-semibold text-white">{componentValue(signal.components.technical)}</p>
        </div>
        <div className="rounded-lg border border-violet-300/15 bg-violet-300/10 p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-violet-200">
            {isSpanish ? "Fundamentos" : "Fundamentals"}
          </p>
          <p className="mt-2 font-semibold text-white">{componentValue(signal.components.fundamental)}</p>
        </div>
        {showFixedIncome ? (
          <div className="rounded-lg border border-emerald-300/15 bg-emerald-300/10 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-emerald-200">
              {isSpanish ? "Renta fija" : "Fixed income"}
            </p>
            <p className="mt-2 font-semibold text-white">{componentValue(signal.components.fixedIncome)}</p>
          </div>
        ) : null}
      </div>

      {compact ? null : (
        <p className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
          {signal.disclaimer}
        </p>
      )}
    </section>
  );
}
