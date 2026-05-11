"use client";

import {
  getFundamentalInterpretationText,
  getRiskLabel,
  getTechnicalInterpretationText,
} from "@/lib/i18n/domain";
import { useLanguage } from "@/lib/i18n/useLanguage";
import type { Asset } from "@/types/asset";

type AISummaryCardProps = {
  asset: Asset;
};

export function AISummaryCard({ asset }: AISummaryCardProps) {
  const { t } = useLanguage();
  const sections = [
    [t("technicalView"), getTechnicalInterpretationText(asset.technicalScore, t)],
    [t("fundamentalView"), getFundamentalInterpretationText(asset.fundamentalScore, t)],
    asset.bondMetrics ? [t("fixedIncomeView"), asset.bondMetrics.interpretation] : undefined,
    [t("riskView"), t("riskViewText", { riskLevel: getRiskLabel(asset.riskLevel, t) })],
    asset.argentinaContext
      ? [t("argentinaFxContext"), t("argentinaFxContextText")]
      : undefined,
    asset.cryptoContext
      ? [t("cryptoVolatilityContext"), t("cryptoVolatilityContextText")]
      : undefined,
  ].filter(Boolean) as [string, string][];

  return (
    <section className="rounded-lg border border-cyan-300/30 bg-gradient-to-br from-cyan-400/15 via-slate-900/85 to-violet-500/15 p-5 shadow-2xl shadow-cyan-950/20 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">{t("aiStyleSummary")}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{t("assetInterpretation", { symbol: asset.symbol })}</h2>
      <p className="mt-4 text-sm leading-6 text-slate-300">
        {t("aiAssetIntro", { name: asset.name })}
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {sections.map(([label, text]) => (
          <div key={label} className="rounded-lg border border-white/10 bg-slate-950/45 p-4">
            <p className="text-sm font-semibold text-white">{label}</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
          </div>
        ))}
      </div>
      <p className="mt-5 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">
        {t("disclaimer")}
      </p>
    </section>
  );
}
