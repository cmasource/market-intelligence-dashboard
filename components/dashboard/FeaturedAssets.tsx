"use client";

import Link from "next/link";
import { useMemo } from "react";
import { formatAssetPrice, formatCurrencyValue, formatPercent } from "@/lib/formatters";
import { useProviderQuotes, type ProviderQuoteState } from "@/lib/hooks/useProviderQuotes";
import { getAssetTypeLabel } from "@/lib/i18n/domain";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { isProviderQuoteSupported } from "@/lib/market-data/provider-symbols";
import { useTheme } from "@/lib/theme/useTheme";
import type { Asset } from "@/types/asset";
import { ScoreBadge } from "../ui/ScoreBadge";
import { SectionHeader } from "../ui/SectionHeader";

type FeaturedAssetsProps = {
  assets: Asset[];
};

function getQuoteLabel(quote: ProviderQuoteState | undefined, isSpanish: boolean) {
  if (!quote || quote.isLoading) return isSpanish ? "Actualizando" : "Refreshing";
  if (quote.provider === "fmp" && !quote.isFallback) return isSpanish ? "Proveedor FMP" : "FMP provider";
  if (quote.provider === "yahoo" && !quote.isFallback) return isSpanish ? "Yahoo compatible" : "Yahoo-compatible";
  if (quote.provider === "mock" || quote.isFallback) return isSpanish ? "Simulado" : "Mock";
  return isSpanish ? "Proveedor" : "Provider";
}

export function FeaturedAssets({ assets }: FeaturedAssetsProps) {
  const { t, language } = useLanguage();
  const { resolvedMode } = useTheme();
  const isLight = resolvedMode === "light";
  const isSpanish = language === "es";
  const quoteSymbols = useMemo(() => assets.map((asset) => asset.symbol), [assets]);
  const quotes = useProviderQuotes(quoteSymbols);

  return (
    <section>
      <SectionHeader
        eyebrow={t("featuredEyebrow")}
        title={t("featuredTitle")}
        description={t("featuredDescription")}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {assets.map((asset) => {
          const quote = quotes[asset.symbol];
          const hasProviderSupport = isProviderQuoteSupported(asset.symbol);
          const hasHydratedQuote = hasProviderSupport && quote && !quote.isLoading && typeof quote.price === "number" && Number.isFinite(quote.price);
          const visiblePrice = hasHydratedQuote ? quote.price : asset.price;
          const visibleChange =
            hasHydratedQuote && typeof quote.changePercent === "number" && Number.isFinite(quote.changePercent)
              ? quote.changePercent
              : asset.dailyChange;
          const visibleCurrency = hasHydratedQuote ? quote.currency : asset.quoteCurrency ?? asset.currency;
          const isPositive = visibleChange >= 0;
          const name = language === "es" && asset.nameEs ? asset.nameEs : asset.nameEn ?? asset.name;
          const summary = language === "es" && asset.summaryEs ? asset.summaryEs : asset.summaryEn ?? asset.summary;
          const context = language === "es" ? asset.marketConventionLabelEs ?? asset.settlementContextEs : asset.marketConventionLabelEn ?? asset.settlementContextEn;
          const sourceLabel = hasProviderSupport ? getQuoteLabel(quote, isSpanish) : isSpanish ? "Simulado" : "Mock";

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
                  <p className="mt-1 text-sm text-slate-400">{name}</p>
                </div>
                <span className={isPositive ? "text-sm font-semibold text-emerald-300" : "text-sm font-semibold text-rose-300"}>
                  {formatPercent(visibleChange)}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300">
                  {getAssetTypeLabel(asset.type, t)}
                </span>
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300">{asset.market}</span>
                <ScoreBadge riskLevel={asset.riskLevel} />
                {context ? (
                  <span className="rounded-full border border-violet-300/20 px-2.5 py-1 text-xs text-violet-100">{context}</span>
                ) : null}
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-xs text-cyan-100">
                  {sourceLabel}
                </span>
              </div>
              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{t("priceLabel")}</p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {hasHydratedQuote
                      ? formatCurrencyValue(typeof visiblePrice === "number" ? visiblePrice : asset.price, visibleCurrency, language)
                      : formatAssetPrice(asset.price, asset, language)}
                  </p>
                </div>
                <ScoreBadge score={asset.technicalScore} />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-400">{summary}</p>
              <p className="mt-4 text-sm font-medium text-cyan-200 group-hover:text-white">{t("openIntelligenceProfile")}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
