"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AssetLogo } from "@/components/assets/AssetLogo";
import { WatchlistButton } from "@/components/watchlist/WatchlistButton";
import { formatCurrencyValue, formatPercent } from "@/lib/formatters";
import { isArgentinaInstrument } from "@/lib/argentina";
import { useArgentinaQuotes } from "@/lib/hooks/useArgentinaQuotes";
import { useProviderQuotes } from "@/lib/hooks/useProviderQuotes";
import { getAssetTypeLabel } from "@/lib/i18n/domain";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { isProviderQuoteSupported } from "@/lib/market-data/provider-symbols";
import { useTheme } from "@/lib/theme/useTheme";
import type { Asset } from "@/types/asset";
import { ScoreBadge } from "../ui/ScoreBadge";

type FeaturedAssetsProps = {
  assets: Asset[];
};

export function FeaturedAssets({ assets }: FeaturedAssetsProps) {
  const { t, language } = useLanguage();
  const { resolvedMode } = useTheme();
  const isLight = resolvedMode === "light";
  const isSpanish = language === "es";
  const quoteSymbols = useMemo(() => assets.map((asset) => asset.symbol), [assets]);
  const quotes = useProviderQuotes(quoteSymbols);
  const argentinaSymbols = useMemo(
    () => assets.filter((asset) => asset.argentinaContext && isArgentinaInstrument(asset.symbol)).map((asset) => asset.symbol),
    [assets],
  );
  const argentinaQuotes = useArgentinaQuotes(argentinaSymbols);

  return (
    <section className="cma-panel p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">{isSpanish ? "Activos destacados" : "Featured assets"}</h2>
          <p className="mt-2 text-sm text-slate-400">{isSpanish ? "Seleccionados por lectura combinada y movimiento de mercado." : "Selected by combined reading and market movement."}</p>
        </div>
        <Link href="/markets" className="text-sm font-semibold text-cyan-200 hover:text-white">{isSpanish ? "Ver mercados" : "View markets"}</Link>
      </div>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 xl:grid-cols-3">
        {assets.map((asset, index) => {
          const quote = quotes[asset.symbol];
          const argentinaQuote = argentinaQuotes[asset.symbol];
          const hasArgentinaQuote = asset.argentinaContext && argentinaQuote && !argentinaQuote.isLoading && typeof argentinaQuote.price === "number";
          const hasProviderSupport = isProviderQuoteSupported(asset.symbol);
          const hasHydratedQuote = !hasArgentinaQuote && hasProviderSupport && quote && !quote.isLoading && typeof quote.price === "number" && Number.isFinite(quote.price);
           const visiblePrice = hasArgentinaQuote ? argentinaQuote.price : hasHydratedQuote ? quote.price : null;
          const visibleChange =
            hasArgentinaQuote && typeof argentinaQuote.changePercent === "number" && Number.isFinite(argentinaQuote.changePercent)
              ? argentinaQuote.changePercent
              : hasHydratedQuote && typeof quote.changePercent === "number" && Number.isFinite(quote.changePercent)
                ? quote.changePercent
                 : null;
          const visibleCurrency = hasArgentinaQuote ? argentinaQuote.currency : hasHydratedQuote ? quote.currency : asset.quoteCurrency ?? asset.currency;
           const isPositive = typeof visibleChange === "number" && visibleChange >= 0;
          const name = language === "es" && asset.nameEs ? asset.nameEs : asset.nameEn ?? asset.name;
          const summary = language === "es" && asset.summaryEs ? asset.summaryEs : asset.summaryEn ?? asset.summary;
          const context = language === "es" ? asset.marketConventionLabelEs ?? asset.settlementContextEs : asset.marketConventionLabelEn ?? asset.settlementContextEn;
          return (
            <article
              key={asset.symbol}
              className={`cma-card-price w-[82vw] max-w-sm shrink-0 snap-start p-4 backdrop-blur md:w-auto md:max-w-none ${
                isLight
                  ? "bg-white/90 shadow-xl shadow-slate-900/10"
                  : ["bg-cyan-300/[0.065]", "bg-violet-300/[0.065]", "bg-emerald-300/[0.06]", "bg-amber-300/[0.055]"][index % 4] + " shadow-2xl shadow-black/10"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <AssetLogo symbol={asset.symbol} name={name} type={asset.type} size="sm" />
                  <div className="min-w-0">
                    <p className="text-lg font-semibold text-white">{asset.symbol}</p>
                    <p className="mt-1 line-clamp-1 text-sm text-slate-400">{name}</p>
                  </div>
                </div>
                <span className={isPositive ? "text-sm font-semibold text-emerald-300" : "text-sm font-semibold text-rose-300"}>
                   {typeof visibleChange === "number" ? formatPercent(visibleChange) : "N/D"}
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
              </div>
              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{t("priceLabel")}</p>
                  <p className="mt-1 text-xl font-semibold text-white">
                     {typeof visiblePrice === "number"
                       ? formatCurrencyValue(visiblePrice, visibleCurrency, language)
                       : "N/D"}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-400">{summary}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-medium">
                <Link href={`/asset/${encodeURIComponent(asset.symbol)}`} className="text-cyan-200 hover:text-white">
                  {t("openIntelligenceProfile")}
                </Link>
                <span className="text-slate-500">|</span>
                <Link href={`/report/${encodeURIComponent(asset.symbol)}`} className="text-cyan-200 hover:text-white">
                  {isSpanish ? "Ver reporte" : "View report"}
                </Link>
                <WatchlistButton
                  compact
                  item={{
                    symbol: asset.symbol,
                    name,
                    assetType: asset.type,
                    market: asset.market,
                    currency: visibleCurrency,
                  }}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
