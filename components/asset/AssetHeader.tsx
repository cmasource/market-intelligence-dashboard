"use client";

import { AssetLogo } from "@/components/assets/AssetLogo";
import { WatchlistButton } from "@/components/watchlist/WatchlistButton";
import { formatCurrencyValue, formatDisplayCurrency, formatPercent } from "@/lib/formatters";
import type { ArgentinaQuote } from "@/lib/argentina";
import { getAssetTypeLabel } from "@/lib/i18n/domain";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { isProviderQuoteSupported } from "@/lib/market-data/provider-symbols";
import type { MarketQuoteResponse } from "@/lib/market-data/types";
import type { Asset } from "@/types/asset";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { ScoreBadge } from "../ui/ScoreBadge";
import { useAssetQuote } from "./AssetQuoteProvider";

type AssetHeaderProps = {
  asset: Asset;
};

export function AssetHeader({ asset }: AssetHeaderProps) {
  const { t, language } = useLanguage();
  const { quote, error: quoteError, isArgentina } = useAssetQuote();
  const canUseArgentinaQuote = Boolean(asset.argentinaContext);
  const canUseProviderQuote = !canUseArgentinaQuote && isProviderQuoteSupported(asset.symbol);
  const argentinaQuote = isArgentina ? quote as ArgentinaQuote | null : null;
  const providerQuote = !isArgentina ? quote as MarketQuoteResponse | null : null;
  const visiblePrice =
    canUseArgentinaQuote && typeof argentinaQuote?.price === "number" && Number.isFinite(argentinaQuote.price)
      ? argentinaQuote.price
      :
    canUseProviderQuote && typeof providerQuote?.price === "number" && Number.isFinite(providerQuote.price)
      ? providerQuote.price
      : null;
  const visibleCurrency =
    canUseArgentinaQuote && argentinaQuote?.currency ? argentinaQuote.currency :
    canUseProviderQuote && providerQuote?.currency ? providerQuote.currency : asset.quoteCurrency ?? asset.currency;
  const visibleChange =
    canUseArgentinaQuote && typeof argentinaQuote?.changePercent === "number" && Number.isFinite(argentinaQuote.changePercent)
      ? argentinaQuote.changePercent
      :
    canUseProviderQuote && typeof providerQuote?.changePercent === "number" && Number.isFinite(providerQuote.changePercent)
      ? providerQuote.changePercent
      : null;
  const isPositive = typeof visibleChange === "number" && visibleChange >= 0;
  const name = language === "es" && asset.nameEs ? asset.nameEs : asset.nameEn ?? asset.name;
  const summary = language === "es" && asset.summaryEs ? asset.summaryEs : asset.summaryEn ?? asset.summary;
  const context = language === "es" ? asset.marketConventionLabelEs ?? asset.settlementContextEs : asset.marketConventionLabelEn ?? asset.settlementContextEn;
  const formattedPrice = typeof visiblePrice === "number"
    ? formatCurrencyValue(visiblePrice, visibleCurrency, language)
    : "N/D";
  const priceLabel = typeof visiblePrice === "number"
    ? language === "es" ? "Precio de mercado" : "Market price"
    : quoteError
      ? language === "es" ? "Cotizacion no disponible" : "Quote unavailable"
      : language === "es" ? "Actualizando cotizacion" : "Refreshing quote";

  return (
    <section className="cma-panel-elevated cma-asset-hero p-5" data-testid="asset-hero-header">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <AssetLogo symbol={asset.symbol} name={name} type={asset.type} size="lg" className="ring-1 ring-white/10" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-semibold tracking-tight text-white">{asset.symbol}</h1>
                <ScoreBadge riskLevel={asset.riskLevel} />
              </div>
              <p className="mt-3 text-lg text-slate-300">{name}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>{getAssetTypeLabel(asset.type, t)}</Badge>
            <Badge>{asset.market}</Badge>
            <Badge>{formatDisplayCurrency(asset.currency, language)}</Badge>
            {asset.argentinaContext ? <Badge tone="positive">BYMA / Argentina</Badge> : null}
            {asset.type === "cedear" ? <Badge tone="accent">CEDEAR</Badge> : null}
            {context ? <Badge tone="accent">{context}</Badge> : null}
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-300">{summary}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button href={`/report/${encodeURIComponent(asset.symbol)}`} variant="primary">
              {language === "es" ? "Ver reporte" : "View report"}
            </Button>
            <Button href="/methodology">{language === "es" ? "Ver metodologia" : "View methodology"}</Button>
            <Button href="#asset-coverage">{language === "es" ? "Ver cobertura" : "View coverage"}</Button>
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
          <p className="text-xs uppercase text-slate-500">{priceLabel}</p>
          <p className="cma-metric mt-2 text-4xl font-semibold text-white">{formattedPrice}</p>
          <p className={isPositive ? "mt-2 text-sm font-semibold text-emerald-300" : "mt-2 text-sm font-semibold text-rose-300"}>
            {typeof visibleChange === "number" ? `${formatPercent(visibleChange)} ${t("today")}` : "N/D"}
          </p>
          {quoteError && canUseProviderQuote ? (
            <p className="mt-2 text-xs leading-5 text-slate-500">{quoteError}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
