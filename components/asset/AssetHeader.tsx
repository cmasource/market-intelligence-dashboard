"use client";

import { formatAssetPrice, formatDisplayCurrency, formatPercent } from "@/lib/formatters";
import { getAssetTypeLabel } from "@/lib/i18n/domain";
import { useLanguage } from "@/lib/i18n/useLanguage";
import type { Asset } from "@/types/asset";
import { ScoreBadge } from "../ui/ScoreBadge";

type AssetHeaderProps = {
  asset: Asset;
};

export function AssetHeader({ asset }: AssetHeaderProps) {
  const { t, language } = useLanguage();
  const isPositive = asset.dailyChange >= 0;
  const name = language === "es" && asset.nameEs ? asset.nameEs : asset.nameEn ?? asset.name;
  const summary = language === "es" && asset.summaryEs ? asset.summaryEs : asset.summaryEn ?? asset.summary;
  const context = language === "es" ? asset.marketConventionLabelEs ?? asset.settlementContextEs : asset.marketConventionLabelEn ?? asset.settlementContextEn;

  return (
    <section className="rounded-lg border border-cyan-300/20 bg-slate-900/70 p-5 shadow-2xl shadow-cyan-950/20 backdrop-blur">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-semibold tracking-tight text-white">{asset.symbol}</h1>
            <ScoreBadge riskLevel={asset.riskLevel} />
            <ScoreBadge score={asset.technicalScore} label={t("technicalView")} />
            {asset.fundamentalScore !== undefined ? <ScoreBadge score={asset.fundamentalScore} label={t("fundamentalView")} /> : null}
          </div>
          <p className="mt-3 text-lg text-slate-300">{name}</p>
          <p className="mt-2 text-sm text-slate-500">
            {getAssetTypeLabel(asset.type, t)} | {asset.market} | {formatDisplayCurrency(asset.currency, language)}
          </p>
          {context ? (
            <p className="mt-2 inline-flex rounded-full border border-violet-300/25 bg-violet-300/10 px-3 py-1 text-xs font-medium text-violet-100">
              {context}
            </p>
          ) : null}
          <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-300">{summary}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5 lg:min-w-64">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{t("mockPrice")}</p>
          <p className="mt-2 text-4xl font-semibold text-white">{formatAssetPrice(asset.price, asset, language)}</p>
          <p className={isPositive ? "mt-2 text-sm font-semibold text-emerald-300" : "mt-2 text-sm font-semibold text-rose-300"}>
            {formatPercent(asset.dailyChange)} {t("today")}
          </p>
        </div>
      </div>
    </section>
  );
}
