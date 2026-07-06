"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatNumber, formatPercent, formatScore } from "@/lib/formatters";
import { GlossaryLabel } from "@/components/glossary/GlossaryLabel";
import type { FundamentalsResponse, FundamentalsSnapshot } from "@/lib/fundamentals-data/types";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { translateProviderLabel } from "@/lib/i18n/interpretation-labels";
import { buildHumanFundamentalSummary } from "@/lib/intelligence/interpretation";
import type { AssetType } from "@/types/asset";
import type { Asset } from "@/types/asset";
import type { FundamentalMetrics } from "@/types/fundamentals";
import { MetricGrid } from "../ui/MetricGrid";
import { SectionHeader } from "../ui/SectionHeader";

type FundamentalAnalysisCardProps = {
  asset?: Asset;
  symbol?: string;
  assetType?: AssetType;
  fallbackFundamentals?: FundamentalMetrics;
  fallbackFundamentalScore?: number;
  currency?: string;
};

function ratio(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function formatOptionalNumber(value: number | undefined, fallback: string) {
  const safeValue = ratio(value);
  return safeValue === undefined ? fallback : formatNumber(safeValue);
}

function formatOptionalCurrency(value: number | undefined, currency: string, fallback: string, language: "en" | "es" = "en") {
  const safeValue = ratio(value);
  return safeValue === undefined ? fallback : formatCurrency(safeValue, currency, language);
}

function formatOptionalPercent(value: number | undefined, fallback: string) {
  const safeValue = ratio(value);
  return safeValue === undefined ? fallback : formatPercent(safeValue * 100);
}

function fallbackSnapshot(
  asset: Asset | undefined,
  fallbackFundamentals: FundamentalMetrics | undefined,
): FundamentalsSnapshot {
  const fundamentals = fallbackFundamentals ?? asset?.fundamentals;

  if (!fundamentals) return {};

  return {
    marketPrice: asset?.price,
    trailingPE: fundamentals.peRatio,
    priceToBook: fundamentals.pbRatio,
    eps: fundamentals.eps,
    bookValuePerShare: fundamentals.bookValuePerShare,
    roe: fundamentals.roe / 100,
    roa: fundamentals.roa / 100,
    ebitdaMargin: fundamentals.ebitdaMargin / 100,
    dividendYield: fundamentals.dividendYield / 100,
    currency: asset?.currency.includes("/") ? undefined : asset?.currency,
  };
}

function hasAnyFundamental(snapshot: FundamentalsSnapshot) {
  return [
    snapshot.marketPrice,
    snapshot.marketCap,
    snapshot.trailingPE,
    snapshot.forwardPE,
    snapshot.priceToBook,
    snapshot.priceToSales,
    snapshot.pegRatio,
    snapshot.eps,
    snapshot.bookValuePerShare,
    snapshot.roe,
    snapshot.roa,
    snapshot.grossMargin,
    snapshot.operatingMargin,
    snapshot.ebitdaMargin,
    snapshot.netMargin,
    snapshot.revenueGrowth,
    snapshot.earningsGrowth,
    snapshot.debtToEquity,
    snapshot.currentRatio,
    snapshot.quickRatio,
    snapshot.dividendYield,
    snapshot.beta,
    snapshot.fiftyTwoWeekHigh,
    snapshot.fiftyTwoWeekLow,
  ].some((value) => value !== undefined && value !== null);
}

function unavailableFields(snapshot: FundamentalsSnapshot) {
  const fields: Array<keyof FundamentalsSnapshot> = [
    "trailingPE",
    "forwardPE",
    "priceToBook",
    "priceToSales",
    "roe",
    "roa",
    "grossMargin",
    "ebitdaMargin",
    "netMargin",
    "debtToEquity",
    "currentRatio",
    "quickRatio",
  ];

  return fields.filter((field) => snapshot[field] === undefined || snapshot[field] === null);
}

export function FundamentalAnalysisCard({
  asset,
  symbol = asset?.symbol ?? "",
  assetType = asset?.type,
  fallbackFundamentals,
  fallbackFundamentalScore,
  currency = asset?.currency ?? "USD",
}: FundamentalAnalysisCardProps) {
  const { t, language } = useLanguage();
  const [fundamentals, setFundamentals] = useState<FundamentalsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiFailed, setApiFailed] = useState(false);
  const fallback = fallbackSnapshot(asset, fallbackFundamentals);
  const snapshot = fundamentals?.snapshot ?? fallback;
  const score = fundamentals?.fundamentalScore ?? fallbackFundamentalScore ?? asset?.fundamentalScore ?? null;
  const sourceLabel =
    fundamentals?.provider === "unavailable"
      ? t("fundamentalsNotApplicable")
      : fundamentals
        ? fundamentals.isFallback
          ? t("fundamentalsFallback")
          : t("fundamentalsProvider")
        : hasAnyFundamental(fallback)
          ? t("fundamentalsFallback")
          : t("fundamentalsNotApplicable");
  const isNotApplicable = fundamentals?.provider === "unavailable" || (!hasAnyFundamental(snapshot) && !loading);
  const usesUnderlying = Boolean(fundamentals?.symbol && symbol && fundamentals.symbol.toUpperCase() !== symbol.toUpperCase());
  const missingFieldList = fundamentals?.missingFields ?? unavailableFields(snapshot);
  const hasPartialCoverage = hasAnyFundamental(snapshot) && missingFieldList.length >= 6;
  const coveragePercent =
    typeof fundamentals?.coverageRatio === "number" ? Math.round(fundamentals.coverageRatio * 100) : null;
  const coverageNote = language === "es"
    ? "Algunos indicadores no están disponibles desde el proveedor actual."
    : "Some indicators are not available from the current provider.";
  const coverageDetailNote = language === "es"
    ? "Los datos disponibles se muestran primero; los campos N/D dependen de la cobertura del proveedor."
    : "Available data is shown first; N/A fields depend on provider coverage.";
  const safeCurrency = snapshot.currency ?? (currency.includes("/") || currency.includes("CER") ? "USD" : currency);
  const humanSummary = buildHumanFundamentalSummary({
    fundamentalScore: score,
    pe: snapshot.trailingPE ?? null,
    forwardPe: snapshot.forwardPE ?? null,
    pb: snapshot.priceToBook ?? null,
    ps: snapshot.priceToSales ?? null,
    roe: snapshot.roe ?? null,
    roa: snapshot.roa ?? null,
    grossMargin: snapshot.grossMargin ?? null,
    ebitdaMargin: snapshot.ebitdaMargin ?? null,
    netMargin: snapshot.netMargin ?? null,
    debtToEquity: snapshot.debtToEquity ?? null,
    currentRatio: snapshot.currentRatio ?? null,
    quickRatio: snapshot.quickRatio ?? null,
    dividendYield: snapshot.dividendYield ?? null,
    beta: snapshot.beta ?? null,
    sourceLabel,
    unavailableFields: missingFieldList,
  }, language);

  useEffect(() => {
    if (!symbol) return undefined;

    const controller = new AbortController();

    async function loadFundamentals() {
      setLoading(true);
      setApiFailed(false);

      try {
        const response = await fetch(`/api/fundamentals/${encodeURIComponent(symbol)}`, {
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`Fundamentals API returned HTTP ${response.status}.`);

        setFundamentals((await response.json()) as FundamentalsResponse);
      } catch {
        if (!controller.signal.aborted) setApiFailed(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadFundamentals();

    return () => controller.abort();
  }, [symbol]);

  if (isNotApplicable) {
    return (
      <section className="cma-panel cma-module-fundamentals p-5" data-testid="fundamental-analysis-module">
        <SectionHeader
          eyebrow={t("fundamentalAnalysis")}
          title={language === "es" ? t("equityRatiosNotApplicable") : fundamentals?.interpretation.label ?? t("equityRatiosNotApplicable")}
          description={t("equityRatiosNotApplicableText")}
        />
        <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-xs text-slate-300">
          {sourceLabel}
        </div>
        <p className="text-sm leading-6 text-slate-400">
          {assetType === "crypto"
            ? t("cryptoFundamentalsNotApplicable")
            : assetType?.includes("bond")
              ? t("bondFundamentalsNotApplicable")
              : language === "es"
                ? "Las metricas fundamentales de tipo accionario no estan disponibles o no aplican para este instrumento."
                : t("fundamentalInterpretationUnavailable")}
        </p>
      </section>
    );
  }

  const na = t("notAvailable");
  const valuationMetrics = [
    { id: "pe", label: <GlossaryLabel termKey="pe" />, value: formatOptionalNumber(snapshot.trailingPE, na) },
    { id: "forwardPe", label: <GlossaryLabel termKey="forwardPe" />, value: formatOptionalNumber(snapshot.forwardPE, na) },
    { id: "pb", label: <GlossaryLabel termKey="pb" />, value: formatOptionalNumber(snapshot.priceToBook, na) },
    { id: "ps", label: <GlossaryLabel termKey="ps" />, value: formatOptionalNumber(snapshot.priceToSales, na) },
    { id: "peg", label: <GlossaryLabel termKey="peg" />, value: formatOptionalNumber(snapshot.pegRatio, na) },
    { id: "eps", label: <GlossaryLabel termKey="eps" />, value: formatOptionalCurrency(snapshot.eps, safeCurrency, na, language) },
    { id: "bookValuePerShare", label: <GlossaryLabel termKey="bookValuePerShare" fallbackLabel={t("bookValuePerShare")} />, value: formatOptionalCurrency(snapshot.bookValuePerShare, safeCurrency, na, language) },
  ];
  const profitabilityMetrics = [
    { id: "roe", label: <GlossaryLabel termKey="roe" />, value: formatOptionalPercent(snapshot.roe, na) },
    { id: "roa", label: <GlossaryLabel termKey="roa" />, value: formatOptionalPercent(snapshot.roa, na) },
    { id: "grossMargin", label: <GlossaryLabel termKey="grossMargin" />, value: formatOptionalPercent(snapshot.grossMargin, na) },
    { id: "operatingMargin", label: <GlossaryLabel termKey="operatingMargin" />, value: formatOptionalPercent(snapshot.operatingMargin, na) },
    { id: "ebitdaMargin", label: <GlossaryLabel termKey="ebitdaMargin" fallbackLabel={t("ebitdaMargin")} />, value: formatOptionalPercent(snapshot.ebitdaMargin, na) },
    { id: "netMargin", label: <GlossaryLabel termKey="netMargin" />, value: formatOptionalPercent(snapshot.netMargin, na) },
  ];
  const growthAndRiskMetrics = [
    { id: "revenueGrowth", label: <GlossaryLabel termKey="revenueGrowth" />, value: formatOptionalPercent(snapshot.revenueGrowth, na) },
    { id: "earningsGrowth", label: <GlossaryLabel termKey="earningsGrowth" />, value: formatOptionalPercent(snapshot.earningsGrowth, na) },
    { id: "debtToEquity", label: <GlossaryLabel termKey="debtToEquity" />, value: formatOptionalNumber(snapshot.debtToEquity, na) },
    { id: "currentRatio", label: <GlossaryLabel termKey="currentRatio" />, value: formatOptionalNumber(snapshot.currentRatio, na) },
    { id: "quickRatio", label: <GlossaryLabel termKey="quickRatio" />, value: formatOptionalNumber(snapshot.quickRatio, na) },
  ];
  const marketProfileMetrics = [
    { id: "dividendYield", label: <GlossaryLabel termKey="dividendYield" fallbackLabel={t("dividendYield")} />, value: formatOptionalPercent(snapshot.dividendYield, na) },
    { id: "beta", label: <GlossaryLabel termKey="beta" />, value: formatOptionalNumber(snapshot.beta, na) },
    { id: "fiftyTwoWeekHigh", label: <GlossaryLabel termKey="fiftyTwoWeekHigh" />, value: formatOptionalCurrency(snapshot.fiftyTwoWeekHigh, safeCurrency, na, language) },
    { id: "fiftyTwoWeekLow", label: <GlossaryLabel termKey="fiftyTwoWeekLow" />, value: formatOptionalCurrency(snapshot.fiftyTwoWeekLow, safeCurrency, na, language) },
    { id: "marketCap", label: <GlossaryLabel termKey="marketCap" />, value: formatOptionalCurrency(snapshot.marketCap, safeCurrency, na, language) },
  ];
  const renderMetricSection = (title: string, items: typeof valuationMetrics) => {
    const visibleItems = hasPartialCoverage ? items.filter((item) => item.value !== na) : items;
    if (visibleItems.length === 0) return null;

    return (
      <div>
        <h3 className="mb-2 text-sm font-semibold text-white">{title}</h3>
        <MetricGrid items={visibleItems} />
      </div>
    );
  };

  return (
    <section className="cma-panel cma-module-fundamentals p-5" data-testid="fundamental-analysis-module">
      <SectionHeader
        eyebrow={t("fundamentalAnalysis")}
        title={score === null ? t("fundamentalScoreUnavailable") : t("fundamentalScore", { score: formatScore(score) })}
        description={humanSummary.shortSummary}
      />
      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 font-medium text-cyan-100">
          {loading ? t("fundamentalsLoading") : translateProviderLabel(sourceLabel, language)}
        </span>
        {apiFailed ? <span className="text-amber-100">{t("fundamentalsApiFallback")}</span> : null}
        {hasPartialCoverage ? (
          <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 font-medium text-amber-100">
            {language === "es" ? "Cobertura fundamental parcial" : "Partial fundamental coverage"}
          </span>
        ) : null}
        {usesUnderlying ? (
          <span className="rounded-full border border-violet-300/30 bg-violet-300/10 px-3 py-1 font-medium text-violet-100">
            {language === "es"
              ? `Fundamentos basados en subyacente: ${fundamentals?.symbol}`
              : `Fundamentals based on underlying: ${fundamentals?.symbol}`}
          </span>
        ) : null}
      </div>
      <div className="space-y-4">
        {hasPartialCoverage ? (
          <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-50">
            <p>{coverageNote}</p>
            <p className="mt-1 text-amber-100/85">
              {coverageDetailNote}
              {coveragePercent !== null ? ` ${language === "es" ? "Cobertura estimada" : "Estimated coverage"}: ${coveragePercent}%.` : ""}
            </p>
          </div>
        ) : null}
        <p className="text-sm leading-6 text-slate-300">{humanSummary.expandedSummary}</p>
        {renderMetricSection(t("fundamentalsValuation"), valuationMetrics)}
        {renderMetricSection(t("fundamentalsProfitability"), profitabilityMetrics)}
        {renderMetricSection(t("fundamentalsGrowthRisk"), growthAndRiskMetrics)}
        {renderMetricSection(t("fundamentalsMarketProfile"), marketProfileMetrics)}
        {hasPartialCoverage ? (
          <details className="rounded-lg border border-white/10 bg-slate-950/35 p-3 text-sm text-slate-400">
            <summary className="cursor-pointer font-medium text-slate-200">
              {language === "es" ? "Campos no disponibles desde el proveedor actual" : "Fields unavailable from the current provider"}
            </summary>
            <p className="mt-2 leading-6">
              {missingFieldList.map((field) => String(field)).join(", ")}
            </p>
          </details>
        ) : null}
      </div>
      {humanSummary.bulletPoints.length ? (
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
          {humanSummary.bulletPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
