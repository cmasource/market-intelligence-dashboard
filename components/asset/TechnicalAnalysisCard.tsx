"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatNumber, formatScore } from "@/lib/formatters";
import { useLanguage } from "@/lib/i18n/useLanguage";
import type { TechnicalAnalysisResponse, TechnicalIndicatorSnapshot } from "@/lib/analysis/types";
import { TechnicalSignalGauge } from "@/components/analysis/TechnicalSignalGauge";
import type { Timeframe } from "@/types/chart";
import type { TechnicalIndicators } from "@/types/technical";
import type { Asset } from "@/types/asset";
import { MetricGrid } from "../ui/MetricGrid";
import { SectionHeader } from "../ui/SectionHeader";

type TechnicalAnalysisCardProps = {
  asset?: Asset;
  symbol?: string;
  currency?: string;
  initialTimeframe?: Timeframe;
  fallbackTechnicalData?: TechnicalIndicators;
  fallbackTechnicalScore?: number;
};

const defaultTimeframe: Timeframe = "1Y";

function nullableNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatNullableNumber(value: number | null | undefined, fallback: string) {
  const safeValue = nullableNumber(value);
  return safeValue === null ? fallback : formatNumber(safeValue);
}

function formatNullableCurrency(value: number | null | undefined, currency: string, fallback: string) {
  const safeValue = nullableNumber(value);
  return safeValue === null ? fallback : formatCurrency(safeValue, currency);
}

function fallbackSnapshot(asset: Asset | undefined, fallbackTechnicalData: TechnicalIndicators | undefined): TechnicalIndicatorSnapshot {
  const technical = fallbackTechnicalData ?? asset?.technical;

  return {
    lastClose: asset?.price ?? null,
    sma20: technical?.sma20 ?? null,
    sma50: technical?.sma50 ?? null,
    sma200: technical?.sma200 ?? null,
    ema12: technical?.ema12 ?? null,
    ema26: technical?.ema26 ?? null,
    rsi14: technical?.rsi14 ?? null,
    macd: null,
    macdSignal: null,
    macdHistogram: null,
    support: technical?.support ?? null,
    resistance: technical?.resistance ?? null,
    volumeTrend: "unavailable",
    trendLabel: technical?.signal ?? "Trend unavailable",
    momentumLabel: technical?.macd ?? "Momentum unavailable",
  };
}

export function TechnicalAnalysisCard({
  asset,
  symbol = asset?.symbol ?? "",
  currency = asset?.currency ?? "USD",
  initialTimeframe = defaultTimeframe,
  fallbackTechnicalData,
  fallbackTechnicalScore,
}: TechnicalAnalysisCardProps) {
  const { t, language } = useLanguage();
  const [analysis, setAnalysis] = useState<TechnicalAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiFailed, setApiFailed] = useState(false);
  const fallback = fallbackSnapshot(asset, fallbackTechnicalData);
  const snapshot = analysis?.snapshot ?? fallback;
  const score = analysis?.technicalScore ?? fallbackTechnicalScore ?? asset?.technicalScore ?? 0;
  const fallbackLabel = t("technicalCalculatedFromFallback");
  const sourceLabel = analysis ? (analysis.isFallback ? fallbackLabel : t("technicalCalculatedFromReal")) : fallbackLabel;
  const warnings = analysis?.warnings ?? [];
  const indicators = [
    [t("chartLastClose"), formatNullableCurrency(snapshot.lastClose, currency, t("notAvailable"))],
    ["SMA 20", formatNullableCurrency(snapshot.sma20, currency, t("notAvailable"))],
    ["SMA 50", formatNullableCurrency(snapshot.sma50, currency, t("notAvailable"))],
    ["SMA 200", formatNullableCurrency(snapshot.sma200, currency, t("notAvailable"))],
    ["EMA 12", formatNullableCurrency(snapshot.ema12, currency, t("notAvailable"))],
    ["EMA 26", formatNullableCurrency(snapshot.ema26, currency, t("notAvailable"))],
    ["RSI 14", formatNullableNumber(snapshot.rsi14, t("notAvailable"))],
    ["MACD", formatNullableNumber(snapshot.macd, t("notAvailable"))],
    ["MACD Signal", formatNullableNumber(snapshot.macdSignal, t("notAvailable"))],
    ["MACD Histogram", formatNullableNumber(snapshot.macdHistogram, t("notAvailable"))],
    [t("support"), formatNullableCurrency(snapshot.support, currency, t("notAvailable"))],
    [t("resistance"), formatNullableCurrency(snapshot.resistance, currency, t("notAvailable"))],
    [t("volumeTrend"), t(`volumeTrend${snapshot.volumeTrend[0].toUpperCase()}${snapshot.volumeTrend.slice(1)}`)],
  ];

  useEffect(() => {
    if (!symbol) return undefined;

    const controller = new AbortController();

    async function loadAnalysis() {
      setLoading(true);
      setApiFailed(false);

      try {
        const response = await fetch(
          `/api/analysis/technical/${encodeURIComponent(symbol)}?timeframe=${encodeURIComponent(initialTimeframe)}`,
          { signal: controller.signal },
        );

        if (!response.ok) throw new Error(`Technical analysis API returned HTTP ${response.status}.`);

        setAnalysis((await response.json()) as TechnicalAnalysisResponse);
      } catch {
        if (!controller.signal.aborted) setApiFailed(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadAnalysis();

    return () => controller.abort();
  }, [initialTimeframe, symbol]);

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.045] p-5 backdrop-blur">
      <SectionHeader
        eyebrow={t("technicalAnalysis")}
        title={t("technicalScore", { score: formatScore(score) })}
        description={analysis?.interpretation.summary ?? t("technicalAnalysisFallbackSummary")}
      />
      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 font-medium text-cyan-100">
          {loading ? t("technicalLoading") : sourceLabel}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-slate-300">
          {initialTimeframe}
        </span>
        {apiFailed ? <span className="text-amber-100">{t("technicalApiFallback")}</span> : null}
      </div>
      <div className="mb-4">
        <TechnicalSignalGauge score={score} language={language} sourceLabel={loading ? t("technicalLoading") : sourceLabel} />
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-slate-950/40 p-3">
          <p className="text-xs text-slate-500">{t("trendLabel")}</p>
          <p className="mt-1 text-sm font-semibold text-white">{snapshot.trendLabel}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-950/40 p-3">
          <p className="text-xs text-slate-500">{t("momentumLabel")}</p>
          <p className="mt-1 text-sm font-semibold text-white">{snapshot.momentumLabel}</p>
        </div>
      </div>
      <MetricGrid items={indicators.map(([label, value]) => ({ label, value }))} />
      {analysis?.interpretation.bulletPoints.length ? (
        <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
          {analysis.interpretation.bulletPoints.map((point) => (
            <li key={point}>- {point}</li>
          ))}
        </ul>
      ) : null}
      {warnings.length ? (
        <div className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
          {warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
