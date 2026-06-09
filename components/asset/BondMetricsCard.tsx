"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/formatters";
import { GlossaryLabel } from "@/components/glossary/GlossaryLabel";
import { getRelatedBondSpecies } from "@/lib/fixed-income";
import {
  translateAmortizationType,
  translateBondLaw,
  translateCouponType,
  translateFixedIncomeCurrency,
  translateProviderLabel,
  translateRiskLevel,
  translateSettlementContext,
  translateSpeciesType,
  translateTradingCurrency,
} from "@/lib/i18n/display-labels";
import { useLanguage } from "@/lib/i18n/useLanguage";
import type { FixedIncomeAnalytics } from "@/lib/fixed-income";
import type { BondMetrics } from "@/types/bonds";
import { MetricGrid } from "../ui/MetricGrid";
import { SectionHeader } from "../ui/SectionHeader";

type BondMetricsCardProps = {
  symbol: string;
  fallbackBondMetrics?: BondMetrics;
  metrics?: BondMetrics;
};

function formatNullableNumber(value: number | null | undefined, fallback: string) {
  return typeof value === "number" && Number.isFinite(value) ? formatNumber(value) : fallback;
}

function formatNullableCurrencyValue(value: number | null | undefined, currency: string, language: "en" | "es", fallback: string) {
  return typeof value === "number" && Number.isFinite(value) ? formatCurrency(value, currency, language) : fallback;
}

function formatNullableRate(value: number | null | undefined, fallback: string) {
  return typeof value === "number" && Number.isFinite(value) ? formatPercent(value * 100) : fallback;
}

export function BondMetricsCard({ symbol, fallbackBondMetrics, metrics }: BondMetricsCardProps) {
  const { language, t } = useLanguage();
  const fallback = fallbackBondMetrics ?? metrics;
  const [analytics, setAnalytics] = useState<FixedIncomeAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unavailable = t("notAvailable");

  useEffect(() => {
    let isMounted = true;

    async function loadAnalytics() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/fixed-income/${encodeURIComponent(symbol)}`);
        if (!response.ok) {
          throw new Error("Fixed income API unavailable");
        }

        const data = (await response.json()) as FixedIncomeAnalytics;
        if (isMounted) setAnalytics(data);
      } catch {
        if (isMounted) {
          setAnalytics(null);
          setError(t("fixedIncomeApiFallback"));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, [symbol, t]);

  const pricingRows = useMemo(() => {
    if (analytics) {
      return [
        { label: <GlossaryLabel termKey="cleanPrice" fallbackLabel={t("cleanPrice")} />, value: formatNullableCurrencyValue(analytics.cleanPrice, analytics.instrument.displayCurrency, language, unavailable) },
        { label: <GlossaryLabel termKey="dirtyPrice" fallbackLabel={t("dirtyPrice")} />, value: formatNullableCurrencyValue(analytics.dirtyPrice, analytics.instrument.displayCurrency, language, unavailable) },
        { label: <GlossaryLabel termKey="accruedInterest" fallbackLabel={t("accruedInterest")} />, value: formatNullableCurrencyValue(analytics.accruedInterest, analytics.instrument.displayCurrency, language, unavailable) },
        { label: <GlossaryLabel termKey="parity" fallbackLabel={t("parity")} />, value: formatNullableRate(analytics.parity, unavailable) },
        { label: <GlossaryLabel termKey="currentYield" fallbackLabel={t("currentYield")} />, value: formatNullableRate(analytics.currentYield, unavailable) },
      ];
    }

    return [
      { label: <GlossaryLabel termKey="parity" fallbackLabel={t("parity")} />, value: fallback ? formatPercent(fallback.parity) : unavailable },
      { label: <GlossaryLabel termKey="coupon" fallbackLabel={t("coupon")} />, value: fallback ? formatPercent(fallback.coupon) : unavailable },
    ];
  }, [analytics, fallback, language, t, unavailable]);

  const sensitivityRows = analytics
    ? [
        { label: <GlossaryLabel termKey="ytm" fallbackLabel="YTM / TIR" />, value: formatNullableRate(analytics.estimatedYTM, unavailable) },
        { label: <GlossaryLabel termKey="duration" fallbackLabel={t("macaulayDuration")} />, value: formatNullableNumber(analytics.macaulayDuration, unavailable) },
        { label: <GlossaryLabel termKey="modifiedDuration" fallbackLabel={t("modifiedDuration")} />, value: formatNullableNumber(analytics.modifiedDuration, unavailable) },
        { label: <GlossaryLabel termKey="convexity" fallbackLabel={t("convexity")} />, value: formatNullableNumber(analytics.convexity, unavailable) },
      ]
    : [
        { label: <GlossaryLabel termKey="tir" fallbackLabel="TIR" />, value: fallback ? formatPercent(fallback.tir) : unavailable },
        { label: <GlossaryLabel termKey="duration" fallbackLabel={t("duration")} />, value: fallback ? formatNumber(fallback.duration) : unavailable },
        { label: <GlossaryLabel termKey="modifiedDuration" fallbackLabel={t("modifiedDuration")} />, value: fallback ? formatNumber(fallback.modifiedDuration) : unavailable },
      ];

  const instrumentRows = analytics
    ? [
        { label: t("symbol"), value: analytics.symbol },
        { label: t("underlyingBond"), value: analytics.instrument.underlyingSymbol },
        { label: t("tradingSpecies"), value: translateSpeciesType(analytics.instrument.speciesType, language) },
        { label: t("tradingCurrency"), value: translateTradingCurrency(analytics.instrument.tradingCurrency, language) },
        { label: t("settlementCurrency"), value: translateFixedIncomeCurrency(analytics.instrument.settlementCurrency, language) },
        { label: t("marketConvention"), value: translateSettlementContext(analytics.instrument.settlementContext, language) },
        { label: t("displayCurrency"), value: translateFixedIncomeCurrency(analytics.instrument.displayCurrency, language) },
        { label: "Indexation", value: analytics.instrument.indexationType === "CER" ? "CER" : unavailable },
        { label: t("relatedSpecies"), value: getRelatedBondSpecies(analytics.symbol).join(", ") },
        { label: t("issuer"), value: analytics.instrument.issuer },
        { label: t("currency"), value: translateFixedIncomeCurrency(analytics.instrument.currency, language) },
        { label: <GlossaryLabel termKey="law" fallbackLabel={t("law")} />, value: translateBondLaw(analytics.instrument.law, language) },
        { label: t("couponType"), value: translateCouponType(analytics.instrument.couponType, language) },
        { label: t("amortizationType"), value: translateAmortizationType(analytics.instrument.amortizationType, language) },
        { label: <GlossaryLabel termKey="maturityDate" fallbackLabel={t("maturityDate")} />, value: analytics.instrument.maturityDate },
        { label: t("couponFrequency"), value: formatNumber(analytics.instrument.couponFrequency) },
      ]
    : [
        { label: t("maturityDate"), value: fallback?.maturityDate ?? unavailable },
        { label: t("currency"), value: fallback?.currency ?? unavailable },
        { label: t("law"), value: fallback?.law ?? unavailable },
      ];

  const riskRows = analytics
    ? [
        { label: t("durationRisk"), value: translateRiskLevel(analytics.risk.durationRisk, language) },
        { label: t("creditRisk"), value: translateRiskLevel(analytics.risk.creditRisk, language) },
        { label: t("currencyRisk"), value: translateRiskLevel(analytics.risk.currencyRisk, language) },
        { label: t("liquidityRisk"), value: translateRiskLevel(analytics.risk.liquidityRisk, language) },
        { label: t("legalRisk"), value: analytics.risk.legalRisk ? translateRiskLevel(analytics.risk.legalRisk, language) : unavailable },
        { label: t("overallRisk"), value: translateRiskLevel(analytics.risk.overallRisk, language) },
      ]
    : [];

  const interpretation = analytics?.interpretation.summary ?? fallback?.interpretation ?? t("fixedIncomeFallbackSummary");
  const sourceLabel = analytics?.isMock
    ? t("mockFixedIncomeAnalytics")
    : analytics?.sourceLabel
      ? translateProviderLabel(analytics.sourceLabel, language)
      : unavailable;

  return (
    <section className="rounded-lg border border-violet-300/20 bg-violet-500/10 p-5 backdrop-blur">
      <SectionHeader
        eyebrow={t("fixedIncome")}
        title={t("fixedIncomeAnalyticsTitle")}
        description={interpretation}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium">
        <span className="rounded-full border border-violet-300/25 bg-violet-300/10 px-3 py-1 text-violet-100">
          {isLoading ? t("fixedIncomeLoading") : sourceLabel}
        </span>
        {error ? <span className="text-amber-200">{error}</span> : null}
      </div>

      <div className="grid gap-5">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">{t("pricing")}</h3>
          <MetricGrid items={pricingRows} />
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">{t("yieldSensitivity")}</h3>
          <MetricGrid items={sensitivityRows} />
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">{t("instrumentDetails")}</h3>
          <MetricGrid items={instrumentRows} />
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">{t("riskProfile")}</h3>
          {riskRows.length > 0 ? (
            <MetricGrid items={riskRows} />
          ) : (
            <p className="rounded-lg border border-amber-300/15 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">
              {language === "es"
                ? "Perfil de riesgo estimado desde datos estructurados hasta contar con analitica completa del proveedor."
                : "Risk profile estimated from structured data until full provider analytics are available."}
            </p>
          )}
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-950/45 p-4">
          <h3 className="text-sm font-semibold text-white">{analytics?.interpretation.label ?? t("fixedIncomeInterpretation")}</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
            {(analytics?.interpretation.bulletPoints ?? [interpretation]).map((point) => (
              <li key={point}>- {point}</li>
            ))}
          </ul>
          {analytics?.warnings?.length ? (
            <ul className="mt-3 space-y-1 text-xs leading-5 text-amber-100">
              {analytics.warnings.map((warning) => (
                <li key={warning}>- {warning}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
