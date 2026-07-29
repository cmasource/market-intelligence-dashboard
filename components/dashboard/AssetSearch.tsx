"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AssetLogo } from "@/components/assets/AssetLogo";
import { formatCurrencyValue, formatDisplayCurrency, formatPercent } from "@/lib/formatters";
import { useArgentinaQuotes } from "@/lib/hooks/useArgentinaQuotes";
import { useProviderQuotes } from "@/lib/hooks/useProviderQuotes";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { searchInstrumentUniverse, type InstrumentUniverseItem } from "@/lib/instrument-universe";
import { isProviderQuoteSupported } from "@/lib/market-data/provider-symbols";
import type { Asset } from "@/types/asset";

type AssetSearchProps = {
  assets: Asset[];
  variant?: "default" | "hero";
};

function resultTone(instrument: InstrumentUniverseItem) {
  if (instrument.category === "crypto") return "border-orange-300/15 bg-orange-300/[0.065] hover:border-orange-300/35 hover:bg-orange-300/[0.1]";
  if (instrument.category === "cedear") return "border-violet-300/15 bg-violet-300/[0.065] hover:border-violet-300/35 hover:bg-violet-300/[0.1]";
  if (instrument.category.includes("bond") || instrument.category === "lecap" || instrument.category === "letra") return "border-amber-300/15 bg-amber-300/[0.06] hover:border-amber-300/35 hover:bg-amber-300/[0.1]";
  if (instrument.country === "AR") return "border-sky-300/15 bg-sky-300/[0.055] hover:border-sky-300/35 hover:bg-sky-300/[0.1]";
  return "border-emerald-300/15 bg-emerald-300/[0.055] hover:border-emerald-300/35 hover:bg-emerald-300/[0.095]";
}

export function AssetSearch({ assets, variant = "default" }: AssetSearchProps) {
  const [query, setQuery] = useState("");
  const [recentSymbols, setRecentSymbols] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { t, language } = useLanguage();
  const isSpanish = language === "es";
  const isHero = variant === "hero";
  const visibleResultLimit = 6;
  const supportedAssetSymbols = useMemo(() => new Set(assets.map((asset) => asset.symbol)), [assets]);
  const assetBySymbol = useMemo(() => new Map(assets.map((asset) => [asset.symbol, asset])), [assets]);

  useEffect(() => {
    queueMicrotask(() => {
      setIsMounted(true);
      try {
        const stored = window.localStorage.getItem("cma-recent-search-symbols");
        setRecentSymbols(stored ? (JSON.parse(stored) as string[]) : []);
      } catch {
        setRecentSymbols([]);
      }
    });
  }, []);

  const filteredInstruments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      if (isHero) return [];
      return searchInstrumentUniverse("", 10);
    }

    return searchInstrumentUniverse(normalizedQuery, 12);
  }, [isHero, query]);
  const visibleInstruments = filteredInstruments.slice(0, visibleResultLimit);
  const hiddenResultsCount = Math.max(0, filteredInstruments.length - visibleInstruments.length);
  const quoteSymbols = useMemo(() => visibleInstruments.map((instrument) => instrument.symbol), [visibleInstruments]);
  const quotes = useProviderQuotes(quoteSymbols);
  const argentinaSymbols = useMemo(
    () => visibleInstruments.filter((instrument) => instrument.country === "AR").map((instrument) => instrument.symbol),
    [visibleInstruments],
  );
  const argentinaQuotes = useArgentinaQuotes(argentinaSymbols);

  function contextLabel(instrument: InstrumentUniverseItem) {
    if (instrument.category === "cedear") return isSpanish ? "Referencia CEDEAR" : "CEDEAR reference";
    if (instrument.country === "US" && instrument.category === "equity") return isSpanish ? "Accion USA" : "USA stock";
    if (instrument.country === "AR" && instrument.category === "equity") return isSpanish ? "Accion argentina" : "Argentine equity";
    if (instrument.category === "etf") return "ETF";
    if (instrument.category === "crypto") return isSpanish ? "Cripto" : "Crypto";
    if (instrument.category.includes("bond")) return isSpanish ? "Bono soberano" : "Sovereign bond";
    if (instrument.category === "equity") return isSpanish ? "Accion" : "Equity";
    return instrument.category.replaceAll("_", " ");
  }

  function groupLabel(instrument: InstrumentUniverseItem) {
    if (instrument.country === "US" && instrument.category === "equity") return isSpanish ? "Acciones USA" : "USA stocks";
    if (instrument.category === "cedear") return "CEDEARs";
    if (instrument.country === "AR" && instrument.category === "equity") return isSpanish ? "Argentina" : "Argentina";
    if (instrument.category.includes("bond") || instrument.category === "lecap" || instrument.category === "letra") return isSpanish ? "Bonos" : "Bonds";
    if (instrument.category === "crypto") return isSpanish ? "Cripto" : "Crypto";
    if (instrument.category === "etf") return "ETFs";
    return isSpanish ? "Otros" : "Other";
  }

  function displayName(instrument: InstrumentUniverseItem) {
    return language === "es" && instrument.displayNameEs ? instrument.displayNameEs : instrument.displayNameEn ?? instrument.displayName;
  }

  function settlementLabel(instrument: InstrumentUniverseItem, asset?: Asset) {
    return language === "es"
      ? asset?.marketConventionLabelEs ?? instrument.marketConventionLabelEs ?? asset?.settlementContextEs ?? instrument.settlementContextEs
      : asset?.marketConventionLabelEn ?? instrument.marketConventionLabelEn ?? asset?.settlementContextEn ?? instrument.settlementContextEn;
  }

  function saveRecentSymbol(symbol: string) {
    // Local-only for the demo. User-account search history can be added later.
    const nextSymbols = [symbol, ...recentSymbols.filter((item) => item !== symbol)].slice(0, 5);
    setRecentSymbols(nextSymbols);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("cma-recent-search-symbols", JSON.stringify(nextSymbols));
    }
  }

  function handleEnterSearch() {
    const firstResult = filteredInstruments[0];
    if (firstResult) saveRecentSymbol(firstResult.symbol);
  }

  return (
    <section className={isHero ? "relative" : "cma-panel-glass p-3 sm:p-4"} id="markets">
      <label htmlFor="asset-search" className="sr-only">
        {t("assetSearchLabel")}
      </label>
      <div className={`flex items-center gap-3 rounded-md border bg-[var(--cma-bg-elevated)] focus-within:border-[var(--cma-border-strong)] ${isHero ? "min-h-16 border-[var(--cma-border-strong)] px-4 sm:px-5" : "border-[var(--cma-border-soft)] px-3"}`}>
        <Search aria-hidden="true" size={18} className="shrink-0 text-[var(--cma-accent-cyan)]" />
        <input
          id="asset-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleEnterSearch();
          }}
          placeholder={t("assetSearchPlaceholder")}
          className={`min-w-0 flex-1 bg-transparent text-[var(--cma-text-primary)] outline-none placeholder:text-[var(--cma-text-muted)] ${isHero ? "py-4 text-base" : "py-3 text-sm sm:text-base"}`}
        />
        <span className="hidden rounded border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] px-2 py-1 text-[10px] font-semibold text-[var(--cma-text-muted)] sm:inline">⌘ K</span>
      </div>
      {!isHero && isMounted && recentSymbols.length ? (
        <div className="mt-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
            {isSpanish ? "Búsquedas recientes" : "Recent searches"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {recentSymbols.map((symbol) => (
              <Link
                key={symbol}
                href={`/asset/${encodeURIComponent(symbol)}`}
                onClick={() => saveRecentSymbol(symbol)}
                className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-white"
              >
                {symbol}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      <div className={`${isHero ? `${query.trim() ? "block" : "hidden"} mt-2 rounded-md border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] p-2 shadow-2xl` : "mt-3 pr-1"} max-h-[24rem] space-y-1.5 overflow-y-auto`}>
        {visibleInstruments.length ? (
          visibleInstruments.map((instrument, index) => {
            const asset = assetBySymbol.get(instrument.symbol);
            const quote = quotes[instrument.symbol];
            const argentinaQuote = argentinaQuotes[instrument.symbol];
            const hasArgentinaQuote =
              instrument.country === "AR" && argentinaQuote && !argentinaQuote.isLoading && typeof argentinaQuote.price === "number";
            const hasProviderSupport = instrument.country !== "AR" && isProviderQuoteSupported(instrument.symbol);
            const hasHydratedQuote = hasProviderSupport && quote && !quote.isLoading && typeof quote.price === "number" && Number.isFinite(quote.price);
            const visibleChange =
              hasArgentinaQuote && typeof argentinaQuote.changePercent === "number" && Number.isFinite(argentinaQuote.changePercent)
                ? argentinaQuote.changePercent
                : hasHydratedQuote && typeof quote.changePercent === "number" && Number.isFinite(quote.changePercent)
                ? quote.changePercent
                 : null;
            const visiblePrice = hasArgentinaQuote ? argentinaQuote.price : hasHydratedQuote ? quote.price : null;
            const visibleCurrency = hasArgentinaQuote ? argentinaQuote.currency : hasHydratedQuote ? quote.currency : asset?.quoteCurrency ?? asset?.currency;
            const positive = typeof visibleChange === "number" && visibleChange >= 0;
            const hasAssetPage = supportedAssetSymbols.has(instrument.symbol);
            const context = settlementLabel(instrument, asset);
            const content = (
              <>
                <span className="flex min-w-0 items-start gap-3">
                  <AssetLogo symbol={instrument.symbol} name={displayName(instrument)} type={instrument.category} size="sm" />
                  <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-white">{instrument.symbol}</span>
                    <span className="text-sm text-slate-400">{displayName(instrument)}</span>
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {contextLabel(instrument)} | {instrument.market} | {formatDisplayCurrency(instrument.currency, language)}
                  </span>
                  {context ? <span className="mt-1 block text-xs font-medium text-violet-200">{context}</span> : null}
                  </span>
                </span>
                <span className="flex flex-col items-start gap-2 text-left sm:items-end sm:text-right">
                  {asset ? (
                    <>
                      <span className="block font-semibold text-white">
                        {typeof visiblePrice === "number" && visibleCurrency
                          ? formatCurrencyValue(visiblePrice, visibleCurrency, language)
                          : "N/D"}
                      </span>
                      <span className={positive ? "text-sm text-emerald-300" : "text-sm text-rose-300"}>
                        {typeof visibleChange === "number" ? formatPercent(visibleChange) : "N/D"}
                      </span>
                    </>
                  ) : (
                    <span className="rounded-md border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
                      {isSpanish ? "Ficha preliminar" : "Preliminary profile"}
                    </span>
                  )}
                  <span className="inline-flex rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-1.5 text-xs font-medium text-cyan-100">
                    {hasAssetPage ? (isSpanish ? "Abrir análisis" : "Open analysis") : isSpanish ? "Ver ficha preliminar" : "View preliminary profile"}
                  </span>
                </span>
              </>
            );

            const group = groupLabel(instrument);
            const previousGroup = index > 0 ? groupLabel(visibleInstruments[index - 1]) : null;

            return (
              <Fragment key={`${instrument.country}-${instrument.market}-${instrument.symbol}-${instrument.category}`}>
              {group !== previousGroup ? (
                <p className="pt-2 text-xs uppercase tracking-[0.16em] text-slate-500">{group}</p>
              ) : null}
              <Link
                href={`/asset/${encodeURIComponent(instrument.symbol)}`}
                onClick={() => saveRecentSymbol(instrument.symbol)}
                className={`group grid gap-3 rounded-md border p-3 transition sm:grid-cols-[minmax(0,1fr)_auto] ${resultTone(instrument)}`}
              >
                {content}
              </Link>
              </Fragment>
            );
          })
        ) : query.trim() ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-400">
            {t("assetSearchNoResults")}
          </div>
        ) : null}
        {hiddenResultsCount > 0 ? (
          <Link
            href={query.trim() ? `/screener?query=${encodeURIComponent(query.trim())}` : "/screener"}
            className="flex items-center justify-center rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/15"
          >
            {isSpanish ? "Ver más en screener" : "See more in screener"}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
