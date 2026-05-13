"use client";

import Link from "next/link";
import { argentinaMarketSymbols, mockAssets } from "@/lib/mock-data";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { getAssetTypeLabel } from "@/lib/i18n/domain";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { SectionHeader } from "../ui/SectionHeader";

export function ArgentinaMarket() {
  const { t, language } = useLanguage();
  const localAssets = mockAssets.filter((asset) =>
    ["GGAL", "YPFD", "AL30", "AL30D", "AL30C", "GD30", "GD30D", "GD30C", "TX26"].includes(asset.symbol),
  );

  return (
    <section id="argentina">
      <SectionHeader
        eyebrow={t("argentinaEyebrow")}
        title={t("argentinaTitle")}
        description={t("argentinaDescription")}
      />
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          {localAssets.map((asset) => (
            <Link
              key={asset.symbol}
              href={`/asset/${encodeURIComponent(asset.symbol)}`}
              className="rounded-lg border border-white/10 bg-white/[0.045] p-4 transition hover:border-violet-300/40 hover:bg-violet-300/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{asset.symbol}</p>
                  <p className="mt-1 text-xs text-slate-400">{getAssetTypeLabel(asset.type, t)}</p>
                </div>
                <span className={asset.dailyChange >= 0 ? "text-sm text-emerald-300" : "text-sm text-rose-300"}>
                  {formatPercent(asset.dailyChange)}
                </span>
              </div>
              <p className="mt-4 text-lg font-semibold text-white">{formatCurrency(asset.price, asset.currency, language)}</p>
            </Link>
          ))}
        </div>
        <div className="rounded-lg border border-violet-300/20 bg-violet-500/10 p-5 backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-200">{t("referenceBoard")}</p>
          <div className="mt-4 grid gap-2">
            {argentinaMarketSymbols.map((symbol) => (
              <div key={symbol} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2">
                <span className="text-sm text-slate-300">{symbol}</span>
                <span className="text-sm font-semibold text-white">{symbol.includes("reference") ? t("mockLiveReady") : t("tracked")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
