"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatNumber, formatScore } from "@/lib/formatters";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { translateMomentumLabel, translateProviderLabel, translateTrendLabel } from "@/lib/i18n/interpretation-labels";
import { buildHumanTechnicalSummary } from "@/lib/intelligence/interpretation";
import type { TechnicalAnalysisResponse, TechnicalIndicatorSnapshot } from "@/lib/analysis/types";
import { TechnicalSignalGauge } from "@/components/analysis/TechnicalSignalGauge";
import { GlossaryLabel } from "@/components/glossary/GlossaryLabel";
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

function formatNullableCurrency(value: number | null | undefined, currency: string, fallback: string, language: "en" | "es" = "en") {
  const safeValue = nullableNumber(value);
  return safeValue === null ? fallback : formatCurrency(safeValue, currency, language);
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
  const humanSummary = buildHumanTechnicalSummary({
    technicalScore: score,
    trend: snapshot.trendLabel,
    momentum: snapshot.momentumLabel,
    rsi: snapshot.rsi14,
    sma20: snapshot.sma20,
    sma50: snapshot.sma50,
    sma200: snapshot.sma200,
    macd: snapshot.macd,
    macdSignal: snapshot.macdSignal,
    support: snapshot.support,
    resistance: snapshot.resistance,
    latestClose: snapshot.lastClose,
    sourceLabel,
  }, language);
  const indicators = [
    { id: "lastClose", label: t("chartLastClose"), value: formatNullableCurrency(snapshot.lastClose, currency, t("notAvailable"), language) },
    { id: "sma20", label: <GlossaryLabel termKey="sma20" />, value: formatNullableCurrency(snapshot.sma20, currency, t("notAvailable"), language) },
    { id: "sma50", label: <GlossaryLabel termKey="sma50" />, value: formatNullableCurrency(snapshot.sma50, currency, t("notAvailable"), language) },
    { id: "sma200", label: <GlossaryLabel termKey="sma200" />, value: formatNullableCurrency(snapshot.sma200, currency, t("notAvailable"), language) },
    { id: "ema12", label: <GlossaryLabel termKey="ema12" />, value: formatNullableCurrency(snapshot.ema12, currency, t("notAvailable"), language) },
    { id: "ema26", label: <GlossaryLabel termKey="ema26" />, value: formatNullableCurrency(snapshot.ema26, currency, t("notAvailable"), language) },
    { id: "rsi14", label: <GlossaryLabel termKey="rsi14" />, value: formatNullableNumber(snapshot.rsi14, t("notAvailable")) },
    { id: "macd", label: <GlossaryLabel termKey="macd" />, value: formatNullableNumber(snapshot.macd, t("notAvailable")) },
    { id: "macdSignal", label: <GlossaryLabel termKey="macdSignal" />, value: formatNullableNumber(snapshot.macdSignal, t("notAvailable")) },
    { id: "macdHistogram", label: <GlossaryLabel termKey="macdHistogram" />, value: formatNullableNumber(snapshot.macdHistogram, t("notAvailable")) },
    { id: "support", label: <GlossaryLabel termKey="support" fallbackLabel={t("support")} />, value: formatNullableCurrency(snapshot.support, currency, t("notAvailable"), language) },
    { id: "resistance", label: <GlossaryLabel termKey="resistance" fallbackLabel={t("resistance")} />, value: formatNullableCurrency(snapshot.resistance, currency, t("notAvailable"), language) },
    {
      id: "volumeTrend",
      label: <GlossaryLabel termKey="volumeTrend" fallbackLabel={t("volumeTrend")} />,
      value: t(`volumeTrend${snapshot.volumeTrend[0].toUpperCase()}${snapshot.volumeTrend.slice(1)}`),
    },
  ];

  useEffect(() => {
    if (!symbol) return undefined;

    const controller = new AbortController();

    async function loadAnalysis() {
      setLoading(true);
      setApiFailed(false);

      try {
        const response = await fetch(
          `/api/analysis/technical/${encodeURIComponent(symbol)}?timeframe=${encodeURIComponent(initialTimeframe)}&language=${language}`,
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
  }, [initialTimeframe, language, symbol]);

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.045] p-5 backdrop-blur">
      <SectionHeader
        eyebrow={t("technicalAnalysis")}
        title={t("technicalScore", { score: formatScore(score) })}
        description={humanSummary.shortSummary}
      />
      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 font-medium text-cyan-100">
          {loading ? t("technicalLoading") : translateProviderLabel(sourceLabel, language)}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-slate-300">
          {initialTimeframe}
        </span>
        {apiFailed ? <span className="text-amber-100">{t("technicalApiFallback")}</span> : null}
      </div>
      <div className="mb-4">
        <TechnicalSignalGauge score={score} language={language} sourceLabel={loading ? t("technicalLoading") : translateProviderLabel(sourceLabel, language)} />
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-slate-950/40 p-3">
          <p className="text-xs text-slate-500">
            <GlossaryLabel termKey="trend" fallbackLabel={t("trendLabel")} />
          </p>
          <p className="mt-1 text-sm font-semibold text-white">{translateTrendLabel(snapshot.trendLabel, language)}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-950/40 p-3">
          <p className="text-xs text-slate-500">
            <GlossaryLabel termKey="momentum" fallbackLabel={t("momentumLabel")} />
          </p>
          <p className="mt-1 text-sm font-semibold text-white">{translateMomentumLabel(snapshot.momentumLabel, language)}</p>
        </div>
      </div>
      <p className="mb-4 text-sm leading-6 text-slate-300">{humanSummary.expandedSummary}</p>
      <MetricGrid items={indicators} />
      {humanSummary.bulletPoints.length ? (
        <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
          {humanSummary.bulletPoints.map((point) => (
            <li key={point}>- {point}</li>
          ))}
        </ul>
      ) : null}
      {humanSummary.warnings.length || warnings.length ? (
        <div className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
          {[...humanSummary.warnings, ...warnings].map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
