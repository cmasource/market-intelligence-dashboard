"use client";

import {
  getTechnicalSignalDescription,
  getTechnicalSignalLabel,
  getTechnicalSignalTone,
} from "@/lib/analysis/technical-signal";
import { formatScore } from "@/lib/formatters";
import { useLanguage } from "@/lib/i18n/useLanguage";

type TechnicalSignalGaugeProps = {
  score: number | null | undefined;
  language?: "en" | "es";
  sourceLabel?: string;
  compact?: boolean;
};

const segments = [
  "bg-rose-400/70",
  "bg-amber-400/70",
  "bg-slate-400/70",
  "bg-cyan-400/75",
  "bg-emerald-400/75",
];

function normalizeScore(score: number | null | undefined) {
  if (typeof score !== "number" || !Number.isFinite(score)) return null;
  return Math.max(0, Math.min(100, score));
}

export function TechnicalSignalGauge({ score, language, sourceLabel, compact = false }: TechnicalSignalGaugeProps) {
  const { language: currentLanguage } = useLanguage();
  const activeLanguage = language ?? currentLanguage;
  const safeScore = normalizeScore(score);
  const pointer = safeScore ?? 0;
  const label = getTechnicalSignalLabel(safeScore, activeLanguage);
  const description = getTechnicalSignalDescription(safeScore, activeLanguage);
  const tone = getTechnicalSignalTone(safeScore);

  return (
    <div className="rounded-lg border border-cyan-300/20 bg-slate-950/45 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
            {activeLanguage === "es" ? "Senal tecnica" : "Technical signal"}
          </p>
          <h3 className="mt-1 text-xl font-semibold text-white">{label}</h3>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-2xl font-semibold text-white">{safeScore === null ? "N/A" : `${formatScore(safeScore)} /100`}</p>
          {sourceLabel ? <p className="mt-1 text-xs text-slate-400">{sourceLabel}</p> : null}
        </div>
      </div>

      <div className="mt-4">
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
          <span>{activeLanguage === "es" ? "Defensivo" : "Defensive"}</span>
          <span>{activeLanguage === "es" ? "Neutral" : "Neutral"}</span>
          <span>{activeLanguage === "es" ? "Constructivo" : "Constructive"}</span>
        </div>
      </div>

      {compact ? null : (
        <>
          <p className="mt-4 text-sm leading-6 text-slate-300">{description}</p>
          <p className="mt-3 rounded-lg border border-amber-300/20 bg-amber-300/10 p-2 text-xs leading-5 text-amber-100">
            {activeLanguage === "es"
              ? "Senal tecnica informativa. No constituye recomendacion de inversion."
              : "Informational technical signal. Not an investment recommendation."}
          </p>
        </>
      )}
      <span className="sr-only">{tone}</span>
    </div>
  );
}
