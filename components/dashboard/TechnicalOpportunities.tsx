"use client";

import Link from "next/link";
import { formatPercent, formatScore } from "@/lib/formatters";
import { getTechnicalSignalLabel } from "@/lib/i18n/domain";
import { useLanguage } from "@/lib/i18n/useLanguage";
import type { Asset } from "@/types/asset";
import { SectionHeader } from "../ui/SectionHeader";

type TechnicalOpportunitiesProps = {
  assets: Asset[];
};

export function TechnicalOpportunities({ assets }: TechnicalOpportunitiesProps) {
  const { t } = useLanguage();
  const rankedAssets = [...assets].sort((a, b) => b.technicalScore - a.technicalScore).slice(0, 6);

  return (
    <section>
      <SectionHeader
        eyebrow={t("technicalScreenEyebrow")}
        title={t("technicalScreenTitle")}
        description={t("technicalScreenDescription")}
      />
      <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-900/70 backdrop-blur">
        <div className="grid grid-cols-[0.7fr_1.4fr_1fr] gap-4 border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.16em] text-slate-500 md:grid-cols-[0.7fr_1.6fr_0.8fr_1fr]">
          <span>{t("assetColumn")}</span>
          <span>{t("signalColumn")}</span>
          <span>{t("scoreColumn")}</span>
          <span className="hidden md:block">{t("changeColumn")}</span>
        </div>
        {rankedAssets.map((asset) => (
          <Link
            key={asset.symbol}
            href={`/asset/${encodeURIComponent(asset.symbol)}`}
            className="grid grid-cols-[0.7fr_1.4fr_1fr] gap-4 border-b border-white/5 px-4 py-4 text-sm transition last:border-b-0 hover:bg-cyan-300/10 md:grid-cols-[0.7fr_1.6fr_0.8fr_1fr]"
          >
            <span className="font-semibold text-white">{asset.symbol}</span>
            <span className="text-slate-300">{getTechnicalSignalLabel(asset.technical.signal, t)}</span>
            <span className="text-cyan-200">{formatScore(asset.technicalScore)}</span>
            <span className={asset.dailyChange >= 0 ? "hidden text-emerald-300 md:block" : "hidden text-rose-300 md:block"}>
              {formatPercent(asset.dailyChange)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
