"use client";

import Link from "next/link";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { getAssetTypeLabel } from "@/lib/i18n/domain";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { useTheme } from "@/lib/theme/useTheme";
import type { Asset } from "@/types/asset";
import { ScoreBadge } from "../ui/ScoreBadge";
import { SectionHeader } from "../ui/SectionHeader";

type FeaturedAssetsProps = {
  assets: Asset[];
};

export function FeaturedAssets({ assets }: FeaturedAssetsProps) {
  const { t } = useLanguage();
  const { resolvedMode } = useTheme();
  const isLight = resolvedMode === "light";

  return (
    <section>
      <SectionHeader
        eyebrow={t("featuredEyebrow")}
        title={t("featuredTitle")}
        description={t("featuredDescription")}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {assets.map((asset) => {
          const isPositive = asset.dailyChange >= 0;

          return (
            <Link
              key={asset.symbol}
              href={`/asset/${encodeURIComponent(asset.symbol)}`}
              className={`group rounded-lg border p-4 backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-300/50 hover:bg-cyan-300/10 ${
                isLight
                  ? "border-slate-300 bg-white/90 shadow-xl shadow-slate-900/10"
                  : "border-white/10 bg-white/[0.045] shadow-2xl shadow-black/10"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-white">{asset.symbol}</p>
                  <p className="mt-1 text-sm text-slate-400">{asset.name}</p>
                </div>
                <span className={isPositive ? "text-sm font-semibold text-emerald-300" : "text-sm font-semibold text-rose-300"}>
                  {formatPercent(asset.dailyChange)}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300">
                  {getAssetTypeLabel(asset.type, t)}
                </span>
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300">{asset.market}</span>
                <ScoreBadge riskLevel={asset.riskLevel} />
              </div>
              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{t("priceLabel")}</p>
                  <p className="mt-1 text-xl font-semibold text-white">{formatCurrency(asset.price, asset.currency)}</p>
                </div>
                <ScoreBadge score={asset.technicalScore} />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-400">{asset.summary}</p>
              <p className="mt-4 text-sm font-medium text-cyan-200 group-hover:text-white">{t("openIntelligenceProfile")}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
