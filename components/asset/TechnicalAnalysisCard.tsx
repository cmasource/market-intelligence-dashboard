"use client";

import { formatCurrency, formatNumber, formatScore } from "@/lib/formatters";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { translateMomentumLabel, translateProviderLabel, translateTrendLabel } from "@/lib/i18n/interpretation-labels";
import { buildHumanTechnicalSummary } from "@/lib/intelligence/interpretation";
import type { TechnicalAnalysisResponse } from "@/lib/analysis/types";
import { GlossaryLabel } from "@/components/glossary/GlossaryLabel";
import type { Timeframe } from "@/types/chart";
import type { Asset } from "@/types/asset";
import { Badge } from "../ui/Badge";
import { MetricGrid } from "../ui/MetricGrid";
import { SectionHeader } from "../ui/SectionHeader";
import { useAssetAnalysis } from "./AssetAnalysisProvider";

type TechnicalAnalysisCardProps = {
  asset?: Asset;
  currency?: string;
  initialTimeframe?: Timeframe;
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

function factorScore(value: number | null | undefined, fallback = 50) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : fallback;
}

export function TechnicalAnalysisCard({
  asset,
  currency = asset?.currency ?? "USD",
  initialTimeframe = defaultTimeframe,
}: TechnicalAnalysisCardProps) {
  const { t, language } = useLanguage();
  const { bundle, loading, error } = useAssetAnalysis();
  const analysis: TechnicalAnalysisResponse | null = bundle?.technical ?? null;
  const apiFailed = Boolean(error);

  if (loading && !analysis) {
    return (
      <section className="cma-panel cma-module-technical p-5" data-testid="technical-analysis-module">
        <SectionHeader eyebrow={t("technicalAnalysis")} title={t("technicalLoading")} />
      </section>
    );
  }

  if (!analysis || analysis.isFallback) {
    return (
      <section className="cma-panel cma-module-technical p-5" data-testid="technical-analysis-module">
        <SectionHeader
          eyebrow={t("technicalAnalysis")}
          title={language === "es" ? "Score tecnico no disponible" : "Technical score unavailable"}
          description={language === "es" ? "No se publica un score cuando falta un historico de mercado verificable." : "A score is not published when verified market history is unavailable."}
        />
      </section>
    );
  }

  const snapshot = analysis.snapshot;
  const score = analysis.technicalScore;
  const sourceLabel = t("technicalCalculatedFromReal");
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
  const factorBars = [
    {
      label: language === "es" ? "Tendencia" : "Trend",
      value: factorScore(score),
      detail: translateTrendLabel(snapshot.trendLabel, language),
    },
    {
      label: "Momentum",
      value: factorScore(snapshot.rsi14),
      detail: translateMomentumLabel(snapshot.momentumLabel, language),
    },
    {
      label: language === "es" ? "Medias moviles" : "Moving averages",
      value: snapshot.lastClose && snapshot.sma200 && snapshot.lastClose > snapshot.sma200 ? 76 : 46,
      detail: "SMA 20 / SMA 200",
    },
    {
      label: "RSI / MACD",
      value: snapshot.rsi14 && snapshot.rsi14 > 70 ? 68 : snapshot.rsi14 && snapshot.rsi14 < 35 ? 38 : 56,
      detail: snapshot.macd === null ? t("notAvailable") : "MACD",
    },
  ];

  return (
    <section className="cma-panel cma-module-technical p-5" data-testid="technical-analysis-module">
      <SectionHeader
        eyebrow={t("technicalAnalysis")}
        title={t("technicalScore", { score: formatScore(score) })}
        description={humanSummary.shortSummary}
      />
      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <Badge tone="accent">{loading ? t("technicalLoading") : translateProviderLabel(sourceLabel, language)}</Badge>
        <Badge>{initialTimeframe}</Badge>
        {apiFailed ? <span className="text-amber-400">{t("technicalApiFallback")}</span> : null}
      </div>
      <div className="mb-4 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] p-3">
        <p className="cma-kicker">
          {language === "es" ? "Motor tecnico - Panel de factores tecnicos" : "Technical engine - Technical factor panel"}
        </p>
        <div className="mt-3 space-y-3">
          {factorBars.map((factor) => (
            <div key={factor.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-slate-200">{factor.label}</span>
                <span className="text-slate-500">{factor.detail}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded bg-slate-800">
                <div className="h-full rounded bg-[var(--cma-accent-cyan)]" style={{ width: `${factor.value}%` }} />
              </div>
            </div>
          ))}
        </div>
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
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
          {humanSummary.bulletPoints.map((point) => (
            <li key={point}>{point}</li>
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
