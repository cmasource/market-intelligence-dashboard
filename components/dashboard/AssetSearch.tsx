"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DataCoverageBadges } from "@/components/data-coverage/DataCoverageBadges";
import { formatAssetPrice, formatDisplayCurrency, formatPercent } from "@/lib/formatters";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { searchInstrumentUniverse, type InstrumentUniverseItem } from "@/lib/instrument-universe";
import type { Asset } from "@/types/asset";
import { ScoreBadge } from "../ui/ScoreBadge";

type AssetSearchProps = {
  assets: Asset[];
};

export function AssetSearch({ assets }: AssetSearchProps) {
  const [query, setQuery] = useState("");
  const [recentSymbols, setRecentSymbols] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { t, language } = useLanguage();
  const isSpanish = language === "es";
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
      return searchInstrumentUniverse("", 10);
    }

    return searchInstrumentUniverse(normalizedQuery, 12);
  }, [query]);
  const visibleInstruments = filteredInstruments.slice(0, visibleResultLimit);
  const hiddenResultsCount = Math.max(0, filteredInstruments.length - visibleInstruments.length);

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
    <section className="h-full rounded-lg border border-cyan-300/20 bg-slate-900/70 p-4 shadow-2xl shadow-cyan-950/20 backdrop-blur" id="markets">
      <label htmlFor="asset-search" className="text-sm font-medium text-slate-200">
        {t("assetSearchLabel")}
      </label>
      <div className="mt-3 rounded-lg border border-white/10 bg-slate-950/70 p-2 focus-within:border-cyan-300/60">
        <input
          id="asset-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleEnterSearch();
          }}
          placeholder={t("assetSearchPlaceholder")}
          className="w-full bg-transparent px-3 py-3 text-base text-white outline-none placeholder:text-slate-500"
        />
      </div>
      {isMounted && recentSymbols.length ? (
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
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-white"
              >
                {symbol}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      <div className="mt-4 max-h-[30rem] space-y-2 overflow-y-auto pr-3">
        {visibleInstruments.length ? (
          visibleInstruments.map((instrument) => {
            const asset = assetBySymbol.get(instrument.symbol);
            const positive = (asset?.dailyChange ?? 0) >= 0;
            const hasAssetPage = supportedAssetSymbols.has(instrument.symbol);
            const context = settlementLabel(instrument, asset);

            const content = (
              <>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-white">{instrument.symbol}</span>
                    <span className="text-sm text-slate-400">{displayName(instrument)}</span>
                    {asset ? <ScoreBadge score={asset.technicalScore} /> : null}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {contextLabel(instrument)} | {instrument.market} | {formatDisplayCurrency(instrument.currency, language)}
                  </span>
                  {context ? <span className="mt-1 block text-xs font-medium text-violet-200">{context}</span> : null}
                  <DataCoverageBadges
                    symbol={instrument.symbol}
                    category={instrument.category}
                    country={instrument.country}
                    compact
                    layers={["price", "technical", "fundamentals"]}
                    className="mt-2"
                  />
                </span>
                <span className="flex flex-col items-start gap-2 text-left sm:items-end sm:text-right">
                  {asset ? (
                    <>
                      <span className="block font-semibold text-white">{formatAssetPrice(asset.price, asset, language)}</span>
                      <span className={positive ? "text-sm text-emerald-300" : "text-sm text-rose-300"}>
                        {formatPercent(asset.dailyChange)}
                      </span>
                    </>
                  ) : (
                    <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-xs text-violet-100">
                      {isSpanish ? "Cobertura futura" : "Future coverage"}
                    </span>
                  )}
                  <span className="inline-flex rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-1.5 text-xs font-medium text-cyan-100">
                    {hasAssetPage ? (isSpanish ? "Abrir análisis" : "Open analysis") : isSpanish ? "Ver ficha preliminar" : "View preliminary profile"}
                  </span>
                </span>
              </>
            );

            return (
              <Link
                key={`${instrument.country}-${instrument.market}-${instrument.symbol}-${instrument.category}`}
                href={`/asset/${encodeURIComponent(instrument.symbol)}`}
                onClick={() => saveRecentSymbol(instrument.symbol)}
                className="group grid gap-4 rounded-lg border border-white/10 bg-white/[0.035] p-3 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 sm:grid-cols-[minmax(0,1fr)_auto]"
              >
                {content}
              </Link>
            );
          })
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-400">
            {t("assetSearchNoResults")}
          </div>
        )}
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
