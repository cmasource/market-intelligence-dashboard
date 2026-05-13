"use client";

import Link from "next/link";
import { DataCoverageLegend } from "@/components/data-coverage/DataCoverageLegend";
import { DataCoverageBadges } from "@/components/data-coverage/DataCoverageBadges";
import { FeaturedAssets } from "@/components/dashboard/FeaturedAssets";
import { MarketOverview } from "@/components/dashboard/MarketOverview";
import { AppShell } from "@/components/layout/AppShell";
import { mockCedears } from "@/lib/cedears";
import { getInstrumentUniverseGroups } from "@/lib/instrument-universe";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { marketOverviewItems, mockAssets } from "@/lib/mock-data";
import { sectionAccents, type SectionAccent } from "@/lib/ui/section-accents";

const groupLinks: Record<string, string> = {
  argentine_equities: "/screener?country=AR&category=equity",
  cedears: "/screener?category=cedear",
  sovereign_bonds: "/screener?country=AR&coverageGroup=mock_fallback",
  etfs: "/screener?category=etf",
  usa_stocks: "/screener?country=US&category=equity",
  crypto: "/screener?category=crypto",
};

const groupAccents: Record<string, SectionAccent> = {
  argentine_equities: "argentina",
  cedears: "cedears",
  sovereign_bonds: "fixedIncome",
  etfs: "usa",
  usa_stocks: "usa",
  crypto: "crypto",
};

const groupTitles: Record<string, { en: string; es: string }> = {
  argentine_equities: { en: "Argentine equities", es: "Acciones argentinas" },
  cedears: { en: "CEDEARs", es: "CEDEARs" },
  sovereign_bonds: { en: "Bonds", es: "Bonos" },
  etfs: { en: "ETFs", es: "ETFs" },
  usa_stocks: { en: "USA stocks", es: "Acciones USA" },
  crypto: { en: "Crypto", es: "Cripto" },
};

export default function MarketsPage() {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const groups = getInstrumentUniverseGroups(language);

  return (
    <AppShell>
      <div className="space-y-8 py-6">
        <section className="rounded-lg border border-cyan-300/20 bg-slate-900/70 p-6 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
            CMA Market Intelligence
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            {isSpanish ? "Mercados" : "Markets"}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            {isSpanish
              ? "Explora el universo actual de instrumentos disponibles, simulados y de cobertura futura."
              : "Explore the current universe of supported, simulated and future instruments."}
          </p>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          {groups.map((group) => (
            <article key={group.id} className={`rounded-lg border bg-slate-950/55 p-5 ${sectionAccents[groupAccents[group.id] ?? "default"].card}`}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-white">{groupTitles[group.id]?.[isSpanish ? "es" : "en"] ?? group.title}</h2>
                <span className={`rounded-full border px-3 py-1 text-xs ${sectionAccents[groupAccents[group.id] ?? "default"].badge}`}>
                  {group.instruments.length}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">{group.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {group.instruments.slice(0, 6).map((instrument) => (
                  <span key={`${group.id}-${instrument.symbol}-${instrument.category}`} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-300">
                    {instrument.symbol}
                  </span>
                ))}
              </div>
              <Link
                href={groupLinks[group.id] ?? "/screener"}
                className="mt-5 inline-flex rounded-lg border border-cyan-300/30 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/10"
              >
                {isSpanish ? "Ver en screener" : "View in screener"}
              </Link>
            </article>
          ))}
        </section>

        <section className="rounded-lg border border-violet-300/20 bg-violet-300/10 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
            {isSpanish ? "Módulo argentino" : "Argentina module"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">CEDEARs</h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
            {isSpanish
              ? "Los CEDEARs permiten exposición local a acciones y ETFs internacionales. En esta demo, los precios locales y ratios se modelan de forma simulada hasta integrar datos de BYMA/IOL o proveedores licenciados."
              : "CEDEARs enable local exposure to international stocks and ETFs. In this demo, local prices and ratios are modeled as mock data until BYMA/IOL or licensed provider integrations are enabled."}
          </p>
          <p className="mt-2 text-xs text-violet-100">
            {isSpanish
              ? "El panel CEDEAR muestra activo subyacente, ratio, precio local simulado y CCL implícito calculado con datos disponibles."
              : "The CEDEAR panel shows underlying asset, ratio, mock local price and implied CCL calculated from available data."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/screener?category=cedear" className="rounded-lg border border-violet-300/30 bg-violet-300/10 px-3 py-2 text-sm font-medium text-violet-100 transition hover:bg-violet-300/15">
              {isSpanish ? "Ver CEDEARs en screener" : "View CEDEARs in screener"}
            </Link>
            <Link href="/methodology" className="rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-violet-300/40 hover:bg-violet-300/10 hover:text-white">
              {isSpanish ? "Metodología CEDEAR" : "CEDEAR methodology"}
            </Link>
            <Link href="/glossary" className="rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-violet-300/40 hover:bg-violet-300/10 hover:text-white">
              {isSpanish ? "Glosario" : "Glossary"}
            </Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {mockCedears.map((cedear) => (
              <Link
                key={cedear.localSymbol}
                href={`/asset/${encodeURIComponent(cedear.localSymbol)}`}
                className="rounded-lg border border-white/10 bg-slate-950/45 p-3 transition hover:border-violet-300/40 hover:bg-violet-300/10"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-white">{cedear.localSymbol}</span>
                  <span className="text-xs text-violet-200">CEDEAR</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">{cedear.underlyingName}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {isSpanish ? "Precio local ARS + CCL implícito" : "Local ARS price + implied CCL"}
                </p>
                <DataCoverageBadges symbol={cedear.localSymbol} category="cedear" country="AR" compact layers={["price", "fundamentals"]} className="mt-3" />
              </Link>
            ))}
          </div>
        </section>

        <DataCoverageLegend />
        <MarketOverview items={marketOverviewItems} />
        <FeaturedAssets assets={mockAssets} />
        <Link
          href="/screener"
          className="block rounded-lg border border-cyan-300/25 bg-cyan-300/10 p-5 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/50 hover:bg-cyan-300/15"
        >
          {isSpanish ? "Abrir screener avanzado" : "Open advanced screener"}
          <span className="mt-2 block font-normal text-slate-300">
            {isSpanish ? "Filtra por mercado, categoría, moneda y estado de cobertura." : "Filter by market, category, currency and coverage status."}
          </span>
        </Link>
      </div>
    </AppShell>
  );
}
