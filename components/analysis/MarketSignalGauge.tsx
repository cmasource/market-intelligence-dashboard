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

const segments = [
  "bg-rose-400/75",
  "bg-amber-400/75",
  "bg-slate-400/75",
  "bg-cyan-400/80",
  "bg-emerald-400/80",
];

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
    <section className="rounded-lg border border-indigo-300/25 bg-gradient-to-br from-slate-950/70 via-slate-900/55 to-indigo-950/35 p-5 shadow-xl shadow-indigo-950/15">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">
            {isSpanish ? "Senal de mercado" : "Market signal"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{signal.label}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{signal.description}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.045] px-4 py-3 text-left md:text-right">
          <p className="text-3xl font-semibold text-white">
            {signal.score === null ? "N/A" : `${formatScore(signal.score)} /100`}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {isSpanish ? "Confianza" : "Confidence"}: {signal.confidenceLabel}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="relative h-3 overflow-hidden rounded-full bg-slate-800/80">
          <div className="grid h-full grid-cols-5">
            {segments.map((segment, index) => (
              <div key={segment} className={`${segment} ${index > 0 ? "border-l border-slate-950/40" : ""}`} />
            ))}
          </div>
          <div
            className="absolute top-1/2 h-6 w-1.5 -translate-y-1/2 rounded-full border border-white/80 bg-white shadow-lg shadow-slate-950/30"
            style={{ left: `calc(${pointer}% - 3px)` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[0.68rem] text-slate-500">
          <span>{isSpanish ? "Defensivo" : "Defensive"}</span>
          <span>Neutral</span>
          <span>{isSpanish ? "Constructivo" : "Constructive"}</span>
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
