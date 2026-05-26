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
  return Object.values(snapshot).some((value) => value !== undefined && value !== null);
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
    unavailableFields: unavailableFields(snapshot),
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
      <section className="rounded-lg border border-white/10 bg-white/[0.045] p-5 backdrop-blur">
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

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.045] p-5 backdrop-blur">
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
      </div>
      <div className="space-y-4">
        <p className="text-sm leading-6 text-slate-300">{humanSummary.expandedSummary}</p>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-white">{t("fundamentalsValuation")}</h3>
          <MetricGrid items={valuationMetrics} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-white">{t("fundamentalsProfitability")}</h3>
          <MetricGrid items={profitabilityMetrics} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-white">{t("fundamentalsGrowthRisk")}</h3>
          <MetricGrid items={growthAndRiskMetrics} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-white">{t("fundamentalsMarketProfile")}</h3>
          <MetricGrid items={marketProfileMetrics} />
        </div>
      </div>
      {humanSummary.bulletPoints.length ? (
        <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
          {humanSummary.bulletPoints.map((point) => (
            <li key={point}>- {point}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
