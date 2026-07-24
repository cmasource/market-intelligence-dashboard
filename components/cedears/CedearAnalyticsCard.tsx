"use client";

import { useEffect, useState } from "react";
import type { CedearAnalytics } from "@/lib/cedears";
import { formatCurrencyValue, formatPercent } from "@/lib/formatters";
import { useLanguage } from "@/lib/i18n/useLanguage";

type CedearAnalyticsCardProps = {
  symbol: string;
};

function formatRatio(ratio: number | null, isSpanish: boolean) {
  if (ratio === null) return "N/A";
  return isSpanish ? `${ratio}:1 CEDEARs por accion` : `${ratio}:1 CEDEARs per share`;
}

function formatCcl(value: number | null | undefined, isSpanish: boolean) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "N/A";
  return `${new Intl.NumberFormat(isSpanish ? "es-AR" : "en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value)} ARS/USD`;
}

function localPriceLabel(analytics: CedearAnalytics, isSpanish: boolean) {
  if (analytics.status === "local_provider") return isSpanish ? "Precio local de mercado" : "Local market price";
  return isSpanish ? "Precio local de referencia" : "Local reference price";
}

function underlyingPriceLabel(analytics: CedearAnalytics, isSpanish: boolean) {
  if (analytics.sourceLabel.toLowerCase().includes("fmp")) return isSpanish ? "Subyacente FMP" : "FMP underlying";
  if (analytics.sourceLabel.toLowerCase().includes("finnhub")) return isSpanish ? "Subyacente Finnhub" : "Finnhub underlying";
  if (analytics.sourceLabel.toLowerCase().includes("yahoo")) return isSpanish ? "Subyacente mercado" : "Market underlying";
  return isSpanish ? "Subyacente" : "Underlying";
}

function statusLabel(analytics: CedearAnalytics, isSpanish: boolean) {
  if (analytics.status === "local_provider") return isSpanish ? "Mercado local" : "Local market";
  if (analytics.status === "provider_underlying") return isSpanish ? "Subyacente" : "Underlying";
  return isSpanish ? "Referencia" : "Reference";
}

function localizedInterpretation(analytics: CedearAnalytics, isSpanish: boolean) {
  if (!isSpanish) return analytics.interpretation;

  return {
    label: analytics.status === "local_provider" ? "Calculo CEDEAR con mercado local" : "Calculo CEDEAR de referencia",
    summary:
      "El CCL implicito se calcula con precio local del CEDEAR, ratio de referencia y precio en dolares del subyacente.",
    bulletPoints: [
      analytics.status === "local_provider"
        ? "El precio local del CEDEAR proviene de una fuente de mercado disponible."
        : "El precio local queda como referencia si la fuente de mercado no responde.",
      "El ratio CEDEAR esta cargado en el maestro local y debe revisarse si cambia el programa.",
      "El CCL implicito es informativo y depende de la convencion de precio y ratio.",
    ],
  };
}

export function CedearAnalyticsCard({ symbol }: CedearAnalyticsCardProps) {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const [analytics, setAnalytics] = useState<CedearAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/cedears/${encodeURIComponent(symbol)}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          setAnalytics(null);
          return;
        }
        setAnalytics((await response.json()) as CedearAnalytics);
      } catch {
        if (!controller.signal.aborted) setAnalytics(null);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [symbol]);

  if (isLoading) {
    return (
      <section className="cma-panel cma-card-argentina p-5">
        <p className="text-sm text-slate-400">{isSpanish ? "Cargando contexto CEDEAR..." : "Loading CEDEAR context..."}</p>
      </section>
    );
  }

  if (!analytics) return null;

  const interpretation = localizedInterpretation(analytics, isSpanish);
  const warnings = analytics.warnings ?? [];
  const labels = {
    eyebrow: isSpanish ? "Exposicion local argentina" : "Local Argentine exposure",
    title: isSpanish ? "Contexto CEDEAR" : "CEDEAR context",
    cedear: "CEDEAR",
    underlying: isSpanish ? "Activo subyacente" : "Underlying asset",
    ratio: isSpanish ? "Ratio CEDEAR" : "CEDEAR ratio",
    localPrice: localPriceLabel(analytics, isSpanish),
    underlyingPrice: underlyingPriceLabel(analytics, isSpanish),
    impliedCcl: isSpanish ? "CCL implicito" : "Implied CCL",
    referenceCcl: isSpanish ? "CCL de referencia" : "Reference CCL",
    spread: "Spread",
    calculated: isSpanish ? "Calculado con datos disponibles" : "Calculated from available data",
  };
  const metrics = [
    { label: labels.cedear, value: analytics.localSymbol },
    { label: labels.underlying, value: `${analytics.underlyingSymbol} - ${analytics.underlyingName}` },
    { label: labels.ratio, value: formatRatio(analytics.ratio, isSpanish) },
    { label: labels.localPrice, value: analytics.localPrice === null ? "N/A" : formatCurrencyValue(analytics.localPrice, "ARS", language) },
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
              ? "Este panel vincula el ticker internacional con su referencia CEDEAR local, ratio y CCL implicito informativo."
              : "This panel links the international ticker with its local CEDEAR reference, ratio and informational implied CCL."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-100">
            {statusLabel(analytics, isSpanish)}
          </span>
          <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
            {labels.calculated}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="min-w-0 rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <p className="break-words text-xs uppercase text-slate-500 [overflow-wrap:anywhere]">{metric.label}</p>
            <p className="mt-2 break-words text-sm font-semibold text-white [overflow-wrap:anywhere]">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.035] p-4">
        <p className="text-sm font-semibold text-white">{interpretation.label}</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{interpretation.summary}</p>
        <ul className="mt-3 space-y-2 text-sm text-slate-400">
          {interpretation.bulletPoints.map((point) => (
            <li key={point}>- {point}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        {warnings.length ? (
          <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
            {warnings.map((warning) => (
              <p key={warning}>- {warning}</p>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
