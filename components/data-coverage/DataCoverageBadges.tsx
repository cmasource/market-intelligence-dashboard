"use client";

import {
  getCoverageStatusLabel,
  getInstrumentDataCoverage,
  getInstrumentContextCoverage,
  type DataLayer,
  type DataCoverageStatus,
} from "@/lib/data-coverage";
import { useLanguage } from "@/lib/i18n/useLanguage";

type DataCoverageBadgesProps = {
  symbol: string;
  category?: string;
  country?: string;
  layers?: DataLayer[];
  compact?: boolean;
  className?: string;
};

const defaultLayers: DataLayer[] = ["price", "technical", "fundamentals", "fixed_income", "news"];

const layerKeys = {
  price: "price",
  chart: "chart",
  technical: "technical",
  fundamentals: "fundamentals",
  fixed_income: "fixedIncome",
  news: "news",
  ai_summary: "aiSummary",
} as const;

function layerLabel(layer: DataLayer, isSpanish: boolean) {
  const labels: Record<DataLayer, { en: string; es: string }> = {
    price: { en: "Price", es: "Precio" },
    chart: { en: "Chart", es: "Grafico" },
    technical: { en: "Technical", es: "Tecnico" },
    fundamentals: { en: "Fundamentals", es: "Fundamentos" },
    fixed_income: { en: "Fixed income", es: "Renta fija" },
    news: { en: "News", es: "Noticias" },
    ai_summary: { en: "AI summary", es: "Resumen IA" },
  };

  return labels[layer][isSpanish ? "es" : "en"];
}

function statusClasses(status: DataCoverageStatus) {
  if (status === "real" || status === "provider") {
    return "border-emerald-300/25 bg-emerald-300/10 text-emerald-100";
  }

  if (status === "mock" || status === "fallback") {
    return "border-cyan-300/25 bg-cyan-300/10 text-cyan-100";
  }

  if (status === "future") {
    return "border-violet-300/25 bg-violet-300/10 text-violet-100";
  }

  if (status === "not_applicable") {
    return "border-slate-500/25 bg-slate-500/10 text-slate-300";
  }

  return "border-rose-300/25 bg-rose-300/10 text-rose-100";
}

function coverageTitle(status: DataCoverageStatus, isSpanish: boolean) {
  if (status === "provider" || status === "real") {
    return isSpanish
      ? "Dato obtenido desde proveedor compatible. FMP fue consultado primero, pero se puede usar Yahoo compatible como fuente efectiva."
      : "Data obtained from a compatible provider. FMP was attempted first, but Yahoo-compatible data may be used as the actual source.";
  }

  return isSpanish
    ? "Indica si los datos provienen de proveedor real, fallback simulado o cobertura futura."
    : "Shows whether data comes from a real provider, mock fallback or future coverage.";
}

export function DataCoverageBadges({
  symbol,
  category,
  country,
  layers = defaultLayers,
  compact = false,
  className = "",
}: DataCoverageBadgesProps) {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const coverage =
    category || country
      ? getInstrumentContextCoverage(symbol, { category, country })
      : getInstrumentDataCoverage(symbol);

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {layers.map((layer) => {
        const status = coverage[layerKeys[layer]];

        return (
          <span
            key={layer}
            title={coverageTitle(status, isSpanish)}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses(status)}`}
          >
            {compact ? null : <span className="text-slate-300">{layerLabel(layer, isSpanish)}: </span>}
            {getCoverageStatusLabel(status, language)}
          </span>
        );
      })}
    </div>
  );
}
