"use client";

import { useEffect, useState } from "react";
import type { CedearAnalytics } from "@/lib/cedears";
import { formatCurrencyValue, formatPercent } from "@/lib/formatters";
import { useLanguage } from "@/lib/i18n/useLanguage";

type CedearAnalyticsCardProps = {
  symbol: string;
};

function formatRatio(ratio: number, isSpanish: boolean) {
  return isSpanish ? `${ratio}:1 CEDEARs por acción` : `${ratio}:1 CEDEARs per share`;
}

function formatCcl(value: number | null | undefined, isSpanish: boolean) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "N/A";
  return `${new Intl.NumberFormat(isSpanish ? "es-AR" : "en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value)} ARS/USD`;
}

export function CedearAnalyticsCard({ symbol }: CedearAnalyticsCardProps) {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const [analytics, setAnalytics] = useState<CedearAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/cedears/${encodeURIComponent(symbol)}`);
        if (!active) return;
        if (!response.ok) {
          setAnalytics(null);
          return;
        }
        setAnalytics(await response.json());
      } catch {
        if (active) setAnalytics(null);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [symbol]);

  if (isLoading) {
    return (
      <section className="rounded-lg border border-violet-300/20 bg-slate-950/55 p-5">
        <p className="text-sm text-slate-400">{isSpanish ? "Cargando contexto CEDEAR..." : "Loading CEDEAR context..."}</p>
      </section>
    );
  }

  if (!analytics) return null;

  const labels = {
    eyebrow: isSpanish ? "Exposición local argentina" : "Local Argentine exposure",
    title: isSpanish ? "Contexto CEDEAR" : "CEDEAR context",
    cedear: "CEDEAR",
    underlying: isSpanish ? "Activo subyacente" : "Underlying asset",
    ratio: isSpanish ? "Ratio CEDEAR" : "CEDEAR ratio",
    localPrice: isSpanish ? "Precio local" : "Local price",
    underlyingPrice: isSpanish ? "Precio subyacente" : "Underlying price",
    impliedCcl: isSpanish ? "CCL implícito" : "Implied CCL",
    referenceCcl: isSpanish ? "CCL de referencia" : "Reference CCL",
    spread: "Spread",
    mock: isSpanish ? "Datos simulados" : "Mock data",
    calculated: isSpanish ? "Calculado con datos disponibles" : "Calculated from available data",
  };

  const metrics = [
    { label: labels.cedear, value: analytics.localSymbol },
    { label: labels.underlying, value: `${analytics.underlyingSymbol} - ${analytics.underlyingName}` },
    { label: labels.ratio, value: formatRatio(analytics.ratio, isSpanish) },
    { label: labels.localPrice, value: formatCurrencyValue(analytics.localPrice, "ARS", language) },
    { label: labels.underlyingPrice, value: analytics.underlyingPrice === null ? "N/A" : formatCurrencyValue(analytics.underlyingPrice, "USD", language) },
    { label: labels.impliedCcl, value: formatCcl(analytics.impliedCcl, isSpanish) },
    { label: labels.referenceCcl, value: formatCcl(analytics.referenceCcl, isSpanish) },
    { label: labels.spread, value: analytics.cclSpread === null || analytics.cclSpread === undefined ? "N/A" : formatPercent(analytics.cclSpread) },
  ];

  return (
    <section className="rounded-lg border border-violet-300/20 bg-slate-950/55 p-5 backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">{labels.eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{labels.title}</h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
            {isSpanish
              ? "Este panel vincula el ticker internacional con su referencia CEDEAR local, ratio simulado y CCL implícito informativo."
              : "This panel links the international ticker with its local CEDEAR reference, mock ratio and informational implied CCL."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-medium text-amber-100">
            {labels.mock}
          </span>
          <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
            {labels.calculated}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{metric.label}</p>
            <p className="mt-2 text-sm font-semibold text-white">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.035] p-4">
        <p className="text-sm font-semibold text-white">{analytics.interpretation.label}</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{analytics.interpretation.summary}</p>
        <ul className="mt-3 space-y-2 text-sm text-slate-400">
          {analytics.interpretation.bulletPoints.map((point) => (
            <li key={point}>- {point}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.2fr]">
        <p className="rounded-lg border border-white/10 bg-white/[0.035] p-3 text-xs leading-5 text-slate-400">
          {analytics.sourceLabel}
        </p>
        {analytics.warnings?.length ? (
          <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
            {analytics.warnings.map((warning) => (
          <p key={warning}>- {warning}</p>
            ))}
            <p>
              -{" "}
              {isSpanish
                ? "El análisis técnico y fundamental se basa en el subyacente cuando no existe integración real del CEDEAR local."
                : "Technical and fundamental analysis is based on the underlying asset when local CEDEAR integration is not available."}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
