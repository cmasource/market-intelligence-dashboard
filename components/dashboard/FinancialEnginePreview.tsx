"use client";

import { calculateBondAnalytics, calculateCAPMExpectedReturn, calculateFundamentalRatios } from "@/lib/finance";
import { formatPercent } from "@/lib/formatters";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { MetricCard } from "../ui/MetricCard";
import { SectionHeader } from "../ui/SectionHeader";

function percentOrFallback(value: number | null) {
  return value === null ? "N/A" : formatPercent(value * 100);
}

export function FinancialEnginePreview() {
  const { t } = useLanguage();
  const ratios = calculateFundamentalRatios({
    netIncome: 150_000_000,
    equity: 900_000_000,
    totalAssets: 1_800_000_000,
    revenue: 1_200_000_000,
    ebitda: 260_000_000,
    sharesOutstanding: 50_000_000,
    marketPrice: 42,
    bookValue: 900_000_000,
    dividendsPerShare: 0.8,
  });
  const bond = calculateBondAnalytics({
    faceValue: 100,
    marketPrice: 92,
    annualCouponRate: 0.08,
    yearsToMaturity: 5,
    paymentsPerYear: 2,
  });
  const capm = calculateCAPMExpectedReturn({
    riskFreeRate: 0.04,
    marketReturn: 0.11,
    beta: 1.2,
  });
  const modules = [
    t("engineFundamentals"),
    t("engineBonds"),
    t("engineCapm"),
    t("engineTradeResults"),
    t("engineTechnicalIndicators"),
  ];

  return (
    <section>
      <SectionHeader
        eyebrow={t("financialEngineEyebrow")}
        title={t("financialEngineTitle")}
        description={t("financialEngineDescription")}
      />
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5 backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">{t("engineCalculationReady")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {modules.map((module) => (
              <span key={module} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-medium text-cyan-100">
                {module}
              </span>
            ))}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard
            label={t("engineMockROE")}
            value={percentOrFallback(ratios.roe)}
            context={t("engineFundamentals")}
            tone="positive"
          />
          <MetricCard
            label={t("engineMockBondYTM")}
            value={percentOrFallback(bond.estimatedYTM)}
            context={t("engineBonds")}
            tone="neutral"
          />
          <MetricCard
            label={t("engineMockCAPM")}
            value={percentOrFallback(capm.expectedReturn)}
            context={t("engineCapm")}
            tone="positive"
          />
        </div>
      </div>
    </section>
  );
}
