"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatNumber, formatPercent, formatScore } from "@/lib/formatters";
import type { FundamentalsResponse, FundamentalsSnapshot } from "@/lib/fundamentals-data/types";
import { useLanguage } from "@/lib/i18n/useLanguage";
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

function formatOptionalCurrency(value: number | undefined, currency: string, fallback: string) {
  const safeValue = ratio(value);
  return safeValue === undefined ? fallback : formatCurrency(safeValue, currency);
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

export function FundamentalAnalysisCard({
  asset,
  symbol = asset?.symbol ?? "",
  assetType = asset?.type,
  fallbackFundamentals,
  fallbackFundamentalScore,
  currency = asset?.currency ?? "USD",
}: FundamentalAnalysisCardProps) {
  const { t } = useLanguage();
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
          title={fundamentals?.interpretation.label ?? t("equityRatiosNotApplicable")}
          description={fundamentals?.interpretation.summary ?? t("equityRatiosNotApplicableText")}
        />
        <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-xs text-slate-300">
          {sourceLabel}
        </div>
        <p className="text-sm leading-6 text-slate-400">
          {assetType === "crypto"
            ? t("cryptoFundamentalsNotApplicable")
            : assetType?.includes("bond")
              ? t("bondFundamentalsNotApplicable")
              : t("fundamentalInterpretationUnavailable")}
        </p>
      </section>
    );
  }

  const na = t("notAvailable");
  const valuationMetrics = [
    ["P/E", formatOptionalNumber(snapshot.trailingPE, na)],
    ["Forward P/E", formatOptionalNumber(snapshot.forwardPE, na)],
    ["P/B", formatOptionalNumber(snapshot.priceToBook, na)],
    ["P/S", formatOptionalNumber(snapshot.priceToSales, na)],
    ["PEG", formatOptionalNumber(snapshot.pegRatio, na)],
    ["EPS/BPA", formatOptionalCurrency(snapshot.eps, safeCurrency, na)],
    [t("bookValuePerShare"), formatOptionalCurrency(snapshot.bookValuePerShare, safeCurrency, na)],
  ];
  const profitabilityMetrics = [
    ["ROE", formatOptionalPercent(snapshot.roe, na)],
    ["ROA", formatOptionalPercent(snapshot.roa, na)],
    ["Gross margin", formatOptionalPercent(snapshot.grossMargin, na)],
    ["Operating margin", formatOptionalPercent(snapshot.operatingMargin, na)],
    [t("ebitdaMargin"), formatOptionalPercent(snapshot.ebitdaMargin, na)],
    ["Net margin", formatOptionalPercent(snapshot.netMargin, na)],
  ];
  const growthAndRiskMetrics = [
    ["Revenue growth", formatOptionalPercent(snapshot.revenueGrowth, na)],
    ["Earnings growth", formatOptionalPercent(snapshot.earningsGrowth, na)],
    ["Debt/equity", formatOptionalNumber(snapshot.debtToEquity, na)],
    ["Current ratio", formatOptionalNumber(snapshot.currentRatio, na)],
    ["Quick ratio", formatOptionalNumber(snapshot.quickRatio, na)],
  ];
  const marketProfileMetrics = [
    [t("dividendYield"), formatOptionalPercent(snapshot.dividendYield, na)],
    ["Beta", formatOptionalNumber(snapshot.beta, na)],
    ["52W high", formatOptionalCurrency(snapshot.fiftyTwoWeekHigh, safeCurrency, na)],
    ["52W low", formatOptionalCurrency(snapshot.fiftyTwoWeekLow, safeCurrency, na)],
    ["Market cap", formatOptionalCurrency(snapshot.marketCap, safeCurrency, na)],
  ];

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.045] p-5 backdrop-blur">
      <SectionHeader
        eyebrow={t("fundamentalAnalysis")}
        title={score === null ? t("fundamentalScoreUnavailable") : t("fundamentalScore", { score: formatScore(score) })}
        description={fundamentals?.interpretation.summary ?? t("fundamentalFallbackSummary")}
      />
      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 font-medium text-cyan-100">
          {loading ? t("fundamentalsLoading") : sourceLabel}
        </span>
        {apiFailed ? <span className="text-amber-100">{t("fundamentalsApiFallback")}</span> : null}
      </div>
      <div className="space-y-4">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-white">{t("fundamentalsValuation")}</h3>
          <MetricGrid items={valuationMetrics.map(([label, value]) => ({ label, value }))} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-white">{t("fundamentalsProfitability")}</h3>
          <MetricGrid items={profitabilityMetrics.map(([label, value]) => ({ label, value }))} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-white">{t("fundamentalsGrowthRisk")}</h3>
          <MetricGrid items={growthAndRiskMetrics.map(([label, value]) => ({ label, value }))} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-white">{t("fundamentalsMarketProfile")}</h3>
          <MetricGrid items={marketProfileMetrics.map(([label, value]) => ({ label, value }))} />
        </div>
      </div>
      {fundamentals?.interpretation.bulletPoints.length ? (
        <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
          {fundamentals.interpretation.bulletPoints.map((point) => (
            <li key={point}>- {point}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
