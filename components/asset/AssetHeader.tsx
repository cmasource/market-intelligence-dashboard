"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AssetLogo } from "@/components/assets/AssetLogo";
import { WatchlistButton } from "@/components/watchlist/WatchlistButton";
import { formatAssetPrice, formatCurrencyValue, formatDisplayCurrency, formatPercent } from "@/lib/formatters";
import type { ArgentinaQuote } from "@/lib/argentina";
import { getAssetTypeLabel } from "@/lib/i18n/domain";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { isProviderQuoteSupported } from "@/lib/market-data/provider-symbols";
import type { MarketQuoteResponse } from "@/lib/market-data/types";
import type { Asset } from "@/types/asset";
import { ScoreBadge } from "../ui/ScoreBadge";

type AssetHeaderProps = {
  asset: Asset;
};

function getSourceLabel(quote: MarketQuoteResponse | null, language: "en" | "es") {
  if (!quote) return language === "es" ? "Precio simulado de respaldo" : "Mock fallback price";
  if (quote.isFallback || quote.provider === "mock") {
    return language === "es" ? "Precio simulado de respaldo" : "Mock fallback price";
  }
  if (quote.provider === "fmp") return language === "es" ? "Precio proveedor: FMP" : "Provider price: FMP";
  if (quote.provider === "yahoo") {
    return language === "es" ? "Precio proveedor: Yahoo compatible" : "Provider price: Yahoo-compatible";
  }
  return language === "es" ? "Precio proveedor" : "Provider price";
}

function getArgentinaSourceLabel(quote: ArgentinaQuote | null, language: "en" | "es") {
  if (!quote) return language === "es" ? "Dato estructurado simulado" : "Structured mock data";
  if (quote.source === "manual") return language === "es" ? "Carga manual validada" : "Validated manual load";
  if (quote.source === "mock") return language === "es" ? "Dato estructurado simulado" : "Structured mock data";
  if (quote.source === "byma_future") return language === "es" ? "Integración BYMA futura" : "Future BYMA integration";
  return quote.sourceLabel;
}

export function AssetHeader({ asset }: AssetHeaderProps) {
  const { t, language } = useLanguage();
  const [providerQuote, setProviderQuote] = useState<MarketQuoteResponse | null>(null);
  const [argentinaQuote, setArgentinaQuote] = useState<ArgentinaQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const canUseArgentinaQuote = Boolean(asset.argentinaContext);
  const canUseProviderQuote = !canUseArgentinaQuote && isProviderQuoteSupported(asset.symbol);
  const visiblePrice =
    canUseArgentinaQuote && typeof argentinaQuote?.price === "number" && Number.isFinite(argentinaQuote.price)
      ? argentinaQuote.price
      :
    canUseProviderQuote && typeof providerQuote?.price === "number" && Number.isFinite(providerQuote.price)
      ? providerQuote.price
      : asset.price;
  const visibleCurrency =
    canUseArgentinaQuote && argentinaQuote?.currency ? argentinaQuote.currency :
    canUseProviderQuote && providerQuote?.currency ? providerQuote.currency : asset.quoteCurrency ?? asset.currency;
  const visibleChange =
    canUseArgentinaQuote && typeof argentinaQuote?.changePercent === "number" && Number.isFinite(argentinaQuote.changePercent)
      ? argentinaQuote.changePercent
      :
    canUseProviderQuote && typeof providerQuote?.changePercent === "number" && Number.isFinite(providerQuote.changePercent)
      ? providerQuote.changePercent
      : asset.dailyChange;
  const isPositive = visibleChange >= 0;
  const name = language === "es" && asset.nameEs ? asset.nameEs : asset.nameEn ?? asset.name;
  const summary = language === "es" && asset.summaryEs ? asset.summaryEs : asset.summaryEn ?? asset.summary;
  const context = language === "es" ? asset.marketConventionLabelEs ?? asset.settlementContextEs : asset.marketConventionLabelEn ?? asset.settlementContextEn;
  const sourceLabel = canUseArgentinaQuote ? getArgentinaSourceLabel(argentinaQuote, language) : getSourceLabel(providerQuote, language);
  const formattedPrice = (canUseProviderQuote && providerQuote?.price) || (canUseArgentinaQuote && argentinaQuote?.price)
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

  useEffect(() => {
    if (!canUseArgentinaQuote) return undefined;
    const controller = new AbortController();

    async function loadArgentinaQuote() {
      try {
        const response = await fetch(`/api/argentina/quote/${encodeURIComponent(asset.symbol)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Argentina quote API returned HTTP ${response.status}.`);
        const quote = (await response.json()) as ArgentinaQuote;
        if (!controller.signal.aborted) setArgentinaQuote(quote);
      } catch (error) {
        if (controller.signal.aborted) return;
        setArgentinaQuote(null);
        setQuoteError(error instanceof Error ? error.message : "Argentina quote request failed.");
      }
    }

    void loadArgentinaQuote();
    return () => controller.abort();
  }, [asset.symbol, canUseArgentinaQuote]);

  return (
    <section className="cma-panel-elevated cma-asset-hero cma-glow-cyan p-5" data-testid="asset-hero-header">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <AssetLogo symbol={asset.symbol} name={name} type={asset.type} size="lg" className="ring-1 ring-white/10" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-semibold tracking-tight text-white">{asset.symbol}</h1>
                <ScoreBadge riskLevel={asset.riskLevel} />
                <ScoreBadge score={asset.technicalScore} label={t("technicalView")} />
                {asset.fundamentalScore !== undefined ? <ScoreBadge score={asset.fundamentalScore} label={t("fundamentalView")} /> : null}
              </div>
              <p className="mt-3 text-lg text-slate-300">{name}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300">
              {getAssetTypeLabel(asset.type, t)}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300">
              {asset.market}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300">
              {formatDisplayCurrency(asset.currency, language)}
            </span>
            {asset.argentinaContext ? (
              <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-100">
                BYMA / Argentina
              </span>
            ) : null}
            {asset.type === "cedear" ? (
              <span className="rounded-full border border-violet-300/25 bg-violet-300/10 px-3 py-1 text-xs font-medium text-violet-100">
                CEDEAR
              </span>
            ) : null}
            {context ? (
              <span className="rounded-full border border-violet-300/25 bg-violet-300/10 px-3 py-1 text-xs font-medium text-violet-100">
                {context}
              </span>
            ) : null}
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-300">{summary}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={`/report/${encodeURIComponent(asset.symbol)}`} className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/15">
              {language === "es" ? "Ver reporte" : "View report"}
            </Link>
            <Link href="/methodology" className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-cyan-300/40 hover:text-white">
              {language === "es" ? "Ver metodologia" : "View methodology"}
            </Link>
            <a href="#asset-coverage" className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-cyan-300/40 hover:text-white">
              {language === "es" ? "Ver cobertura" : "View coverage"}
            </a>
            <WatchlistButton
              item={{
                symbol: asset.symbol,
                name,
                assetType: asset.type,
                market: asset.market,
                currency: visibleCurrency,
              }}
            />
          </div>
        </div>
        <div className="cma-card-price p-5 xl:min-w-80">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{sourceLabel}</p>
          <p className="cma-metric mt-2 text-4xl font-semibold text-white">{formattedPrice}</p>
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
