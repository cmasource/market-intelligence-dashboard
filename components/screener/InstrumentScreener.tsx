"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DataCoverageBadges } from "@/components/data-coverage/DataCoverageBadges";
import { formatDisplayCurrency } from "@/lib/formatters";
import { getCoverageGroupOptions } from "@/lib/data-coverage";
import {
  filterInstrumentUniverse,
  getInstrumentCategories,
  getInstrumentCountries,
  getInstrumentCurrencies,
  getInstrumentMarkets,
  getInstrumentSourceStatuses,
  type InstrumentUniverseFilters,
} from "@/lib/instrument-universe";
import type { InstrumentUniverseItem } from "@/lib/instrument-universe";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { useTheme } from "@/lib/theme/useTheme";
import { mockAssets } from "@/lib/mock-data";

const supportedAssetSymbols = new Set(mockAssets.map((asset) => asset.symbol));

type InstrumentScreenerProps = {
  initialFilters?: InstrumentUniverseFilters;
};

function formatEnum(value: string) {
  return value.replaceAll("_", " ");
}

function sourceStatusLabel(value: string, isSpanish: boolean) {
  const labels: Record<string, { en: string; es: string }> = {
    real_supported: { en: "Real-supported", es: "Datos reales disponibles" },
    mock_supported: { en: "Mock-supported", es: "Datos simulados disponibles" },
    future_supported: { en: "Future coverage", es: "Cobertura futura" },
  };

  return labels[value]?.[isSpanish ? "es" : "en"] ?? formatEnum(value);
}

function coverageBadges(instrument: InstrumentUniverseItem, isSpanish: boolean) {
  const labels = {
    price: isSpanish ? "Precio" : "Price",
    technical: isSpanish ? "Tecnico" : "Technical",
    fundamentals: isSpanish ? "Fundamentos" : "Fundamentals",
    fixedIncome: isSpanish ? "Renta fija" : "Fixed income",
    news: isSpanish ? "Noticias" : "News",
  };

  return Object.entries(instrument.dataCoverage)
    .filter(([, enabled]) => enabled)
    .map(([key]) => labels[key as keyof typeof labels]);
}

export function InstrumentScreener({ initialFilters = {} }: InstrumentScreenerProps) {
  const { language } = useLanguage();
  const { resolvedMode } = useTheme();
  const isSpanish = language === "es";
  const isLight = resolvedMode === "light";
  const [filters, setFilters] = useState<InstrumentUniverseFilters>(initialFilters);

  const categories = getInstrumentCategories();
  const markets = getInstrumentMarkets();
  const countries = getInstrumentCountries();
  const currencies = getInstrumentCurrencies();
  const sourceStatuses = getInstrumentSourceStatuses();
  const coverageGroups = getCoverageGroupOptions(language);

  const results = useMemo(() => filterInstrumentUniverse(filters), [filters]);

  const updateFilter = (key: keyof InstrumentUniverseFilters, value: string) => {
    setFilters((current) => ({
      ...current,
      [key]: value || undefined,
    }));
  };

  return (
    <section
      className={`rounded-lg border p-5 backdrop-blur ${
        isLight
          ? "border-cyan-700/20 bg-white/90 shadow-xl shadow-slate-900/5"
          : "border-cyan-300/20 bg-slate-950/55"
      }`}
    >
      <div className="grid gap-3 lg:grid-cols-[1.5fr_repeat(6,1fr)_auto]">
        <label className="block">
          <span className={`text-xs uppercase tracking-[0.14em] ${isLight ? "text-slate-600" : "text-slate-500"}`}>
            {isSpanish ? "Buscar" : "Search"}
          </span>
          <input
            value={filters.query ?? ""}
            onChange={(event) => updateFilter("query", event.target.value)}
            placeholder={isSpanish ? "Buscar AL30, AAPL, BTC..." : "Search AL30, AAPL, BTC..."}
            className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-cyan-400/70 ${
              isLight
                ? "border-slate-300 bg-white text-slate-950 placeholder:text-slate-500"
                : "border-white/10 bg-slate-950/70 text-white placeholder:text-slate-600"
            }`}
          />
        </label>
        {[
          ["category", isSpanish ? "Categoria" : "Category", categories],
          ["market", isSpanish ? "Mercado" : "Market", markets],
          ["country", isSpanish ? "Pais" : "Country", countries],
          ["currency", isSpanish ? "Moneda" : "Currency", currencies],
          ["sourceStatus", isSpanish ? "Estado" : "Data status", sourceStatuses],
          ["coverageGroup", isSpanish ? "Cobertura" : "Coverage", coverageGroups],
        ].map(([key, label, options]) => (
          <label key={key as string} className="block">
            <span className={`text-xs uppercase tracking-[0.14em] ${isLight ? "text-slate-600" : "text-slate-500"}`}>{label as string}</span>
            <select
              value={(filters[key as keyof InstrumentUniverseFilters] as string | undefined) ?? ""}
              onChange={(event) => updateFilter(key as keyof InstrumentUniverseFilters, event.target.value)}
              className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-cyan-400/70 ${
                isLight ? "border-slate-300 bg-white text-slate-950" : "border-white/10 bg-slate-950/70 text-white"
              }`}
            >
              <option value="">{isSpanish ? "Todos" : "All"}</option>
              {(options as Array<string | { value: string; label: string }>).map((option) => {
                const value = typeof option === "string" ? option : option.value;
                const optionLabel = typeof option === "string" ? option : option.label;

                return (
                <option key={value} value={value}>
                  {key === "sourceStatus" ? sourceStatusLabel(value, isSpanish) : key === "coverageGroup" ? optionLabel : formatEnum(value)}
                </option>
                );
              })}
            </select>
          </label>
        ))}
        <button
          type="button"
          onClick={() => setFilters({})}
          className={`self-end rounded-lg border px-3 py-2 text-sm font-medium transition hover:border-cyan-400/50 hover:bg-cyan-300/10 ${
            isLight ? "border-slate-300 text-slate-700 hover:text-slate-950" : "border-white/10 text-slate-300 hover:text-white"
          }`}
        >
          {isSpanish ? "Resetear" : "Reset"}
        </button>
      </div>

      <p className={`mt-5 text-sm ${isLight ? "text-slate-700" : "text-slate-400"}`}>
        {isSpanish ? `${results.length} instrumentos encontrados` : `${results.length} instruments found`}
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {results.map((instrument) => {
          const hasAssetPage = supportedAssetSymbols.has(instrument.symbol);
          const badges = coverageBadges(instrument, isSpanish);
          const relatedCount = Math.max(0, instrument.relatedSymbols.length - 1);

          return (
            <article
              key={`${instrument.country}-${instrument.market}-${instrument.symbol}-${instrument.category}`}
              className={`rounded-lg border p-4 ${
                isLight ? "border-slate-300 bg-white shadow-lg shadow-slate-900/5" : "border-white/10 bg-white/[0.045]"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">{instrument.symbol}</h3>
                  <p className="mt-1 text-sm text-slate-300">
                    {isSpanish && instrument.displayNameEs ? instrument.displayNameEs : instrument.displayNameEn ?? instrument.displayName}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                    {formatEnum(instrument.category)} | {instrument.market} | {instrument.country} |{" "}
                    {formatDisplayCurrency(instrument.currency, language)}
                  </p>
                  {(isSpanish ? instrument.marketConventionLabelEs ?? instrument.settlementContextEs : instrument.marketConventionLabelEn ?? instrument.settlementContextEn) ? (
                    <p className="mt-1 text-xs font-medium text-violet-200">
                      {isSpanish ? instrument.marketConventionLabelEs ?? instrument.settlementContextEs : instrument.marketConventionLabelEn ?? instrument.settlementContextEn}
                    </p>
                  ) : null}
                  {instrument.category === "cedear" ? (
                    <p className="mt-2 text-xs font-medium text-violet-200">
                      {isSpanish
                        ? `CEDEAR | Subyacente ${instrument.underlyingSymbol ?? instrument.symbol} | BYMA | ARS`
                        : `CEDEAR | Underlying ${instrument.underlyingSymbol ?? instrument.symbol} | BYMA | ARS`}
                    </p>
                  ) : instrument.country === "US" && instrument.category === "equity" ? (
                    <p className="mt-2 text-xs font-medium text-emerald-200">
                      {isSpanish ? "Accion USA" : "USA stock"}
                    </p>
                  ) : null}
                </div>
                <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
                  {sourceStatusLabel(instrument.sourceStatus, isSpanish)}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <DataCoverageBadges
                  symbol={instrument.symbol}
                  category={instrument.category}
                  country={instrument.country}
                  compact
                  layers={["price", "technical", "fundamentals", "fixed_income", "news"]}
                />
                {badges.length > 0 ? (
                  badges.map((badge) => (
                    <span key={badge} className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-xs text-emerald-100">
                      {badge}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-400">
                    {isSpanish ? "Sin cobertura activa" : "No active coverage"}
                  </span>
                )}
                {relatedCount > 0 ? (
                  <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-2.5 py-1 text-xs text-violet-100">
                    {isSpanish ? `${relatedCount} relacionados` : `${relatedCount} related`}
                  </span>
                ) : null}
              </div>

              <div className="mt-5">
                {hasAssetPage ? (
                  <Link
                    href={`/asset/${encodeURIComponent(instrument.symbol)}`}
                    className="inline-flex rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/15 hover:text-white"
                  >
                    {instrument.category === "cedear"
                      ? isSpanish
                        ? "Ver contexto CEDEAR"
                        : "View CEDEAR context"
                      : isSpanish
                        ? "Abrir análisis"
                        : "Open analysis"}
                  </Link>
                ) : (
                  <span className="inline-flex rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-slate-500">
                    {isSpanish ? "Proximamente" : "Coming soon"}
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
