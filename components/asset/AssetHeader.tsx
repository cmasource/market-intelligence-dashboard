"use client";

import { useEffect, useState } from "react";
import { formatAssetPrice, formatCurrencyValue, formatDisplayCurrency, formatPercent } from "@/lib/formatters";
import { getAssetTypeLabel } from "@/lib/i18n/domain";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { isProviderQuoteSupported } from "@/lib/market-data/provider-symbols";
import type { MarketQuoteResponse } from "@/lib/market-data/types";
import type { Asset } from "@/types/asset";
import { ScoreBadge } from "../ui/ScoreBadge";

type AssetHeaderProps = {
  asset: Asset;
};

function getSourceLabel(quote: MarketQuoteResponse | null, fallbackLabel: string, language: "en" | "es") {
  if (!quote) return fallbackLabel;
  if (quote.isFallback || quote.provider === "mock") {
    return language === "es" ? "Precio simulado de respaldo" : "Mock fallback price";
  }
  if (quote.provider === "fmp") return language === "es" ? "Precio proveedor: FMP" : "Provider price: FMP";
  if (quote.provider === "yahoo") {
    return language === "es" ? "Precio proveedor: Yahoo compatible" : "Provider price: Yahoo-compatible";
  }
  return language === "es" ? "Precio proveedor" : "Provider price";
}

export function AssetHeader({ asset }: AssetHeaderProps) {
  const { t, language } = useLanguage();
  const [providerQuote, setProviderQuote] = useState<MarketQuoteResponse | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const canUseProviderQuote = isProviderQuoteSupported(asset.symbol);
  const visiblePrice =
    canUseProviderQuote && typeof providerQuote?.price === "number" && Number.isFinite(providerQuote.price)
      ? providerQuote.price
      : asset.price;
  const visibleCurrency =
    canUseProviderQuote && providerQuote?.currency ? providerQuote.currency : asset.quoteCurrency ?? asset.currency;
  const visibleChange =
    canUseProviderQuote && typeof providerQuote?.changePercent === "number" && Number.isFinite(providerQuote.changePercent)
      ? providerQuote.changePercent
      : asset.dailyChange;
  const isPositive = visibleChange >= 0;
  const name = language === "es" && asset.nameEs ? asset.nameEs : asset.nameEn ?? asset.name;
  const summary = language === "es" && asset.summaryEs ? asset.summaryEs : asset.summaryEn ?? asset.summary;
  const context = language === "es" ? asset.marketConventionLabelEs ?? asset.settlementContextEs : asset.marketConventionLabelEn ?? asset.settlementContextEn;
  const sourceLabel = getSourceLabel(providerQuote, t("mockPrice"), language);
  const formattedPrice = canUseProviderQuote && providerQuote?.price
    ? formatCurrencyValue(visiblePrice, visibleCurrency, language)
    : formatAssetPrice(visiblePrice, asset, language);

  useEffect(() => {
    if (!canUseProviderQuote) return undefined;

    const controller = new AbortController();

    async function loadQuote() {
      try {
        const response = await fetch(`/api/market-data/quote/${encodeURIComponent(asset.symbol)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Quote API returned HTTP ${response.status}.`);
        const quote = (await response.json()) as MarketQuoteResponse;
        if (!controller.signal.aborted) {
          setProviderQuote(quote);
          setQuoteError(quote.error ?? null);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setProviderQuote(null);
        setQuoteError(error instanceof Error ? error.message : "Quote request failed.");
      }
    }

    void loadQuote();

    return () => controller.abort();
  }, [asset.symbol, canUseProviderQuote]);

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
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{sourceLabel}</p>
          <p className="mt-2 text-4xl font-semibold text-white">{formattedPrice}</p>
          <p className={isPositive ? "mt-2 text-sm font-semibold text-emerald-300" : "mt-2 text-sm font-semibold text-rose-300"}>
            {formatPercent(visibleChange)} {t("today")}
          </p>
          {quoteError && canUseProviderQuote ? (
            <p className="mt-2 text-xs leading-5 text-slate-500">{quoteError}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
