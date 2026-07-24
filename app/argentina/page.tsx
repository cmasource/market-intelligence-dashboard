"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArgentinaMarket } from "@/components/dashboard/ArgentinaMarket";
import { BondSpeciesGuide } from "@/components/fixed-income/BondSpeciesGuide";
import { FixedIncomeComparison } from "@/components/fixed-income/FixedIncomeComparison";
import { CnvIssuerCard } from "@/components/cnv/CnvIssuerCard";
import { AppShell } from "@/components/layout/AppShell";
import { MarketHeatmap } from "@/components/market/MarketHeatmap";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { InstrumentUniverseGroups } from "@/components/screener/InstrumentUniverseGroups";
import { ARGENTINA_INSTRUMENT_UNIVERSE } from "@/lib/instrument-universe";
import { formatCurrencyValue, formatNumber, formatPercent } from "@/lib/formatters";
import { cnvIssuers } from "@/lib/cnv";
import type { ArgentinaInstrument, ArgentinaQuote, ArgentinaSourceStatus } from "@/lib/argentina";

const universeGroups = [
  {
    key: "bonds",
    en: "Sovereign bonds and species",
    es: "Bonos soberanos y especies",
    symbols: ["AL30", "AL30D", "AL30C", "GD30", "GD30D", "GD30C", "TX26"],
  },
  {
    key: "equities",
    en: "Argentine equities",
    es: "Acciones argentinas",
    symbols: ["GGAL", "YPFD"],
  },
  {
    key: "cedears",
    en: "CEDEAR examples",
    es: "Ejemplos de CEDEARs",
    symbols: ["AAPL", "MSFT", "KO", "TSLA", "AMZN", "SPY", "QQQ"],
  },
];

const argentinaTableSymbols = [
  "GGAL",
  "YPFD",
  "PAMP",
  "TXAR",
  "ALUA",
  "BYMA",
  "AL30",
  "AL30D",
  "AL30C",
  "GD30",
  "GD30D",
  "GD30C",
  "TX26",
  "AAPL",
  "MSFT",
  "NVDA",
  "TSLA",
  "KO",
  "SPY",
  "QQQ",
];

const localMarketSections = [
  {
    key: "snapshot",
    es: "Panorama local de mercado",
    en: "Local market snapshot",
    symbols: ["AL30", "GD30", "GGAL", "YPFD", "AAPL"],
  },
  {
    key: "bonds",
    es: "Bonos soberanos",
    en: "Sovereign bonds",
    symbols: ["AL30", "AL30D", "AL30C", "GD30", "GD30D", "GD30C", "TX26"],
  },
  {
    key: "equities",
    es: "Acciones argentinas",
    en: "Argentine equities",
    symbols: ["GGAL", "YPFD", "PAMP", "TXAR", "ALUA", "BYMA"],
  },
  {
    key: "cedears",
    es: "CEDEARs destacados",
    en: "Featured CEDEARs",
    symbols: ["AAPL", "MSFT", "NVDA", "TSLA", "KO", "SPY", "QQQ"],
  },
];

function argentinaSourceLabel(source: string, isSpanish: boolean) {
  if (source === "yahoo") return isSpanish ? "Yahoo Finance (no oficial)" : "Yahoo Finance (unofficial)";
  if (source === "manual") return isSpanish ? "Carga manual validada" : "Validated manual load";
  if (source === "mock" || source === "unavailable") return isSpanish ? "No disponible" : "Unavailable";
  if (source === "byma_future") return isSpanish ? "Integración BYMA futura" : "Future BYMA integration";
  if (source === "cnv_future") return isSpanish ? "CNV futura" : "Future CNV";
  if (source === "broker_future") return isSpanish ? "Broker/API futuro" : "Future broker/API";
  return isSpanish ? "No disponible" : "Unavailable";
}

export default function ArgentinaPage() {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const [quotes, setQuotes] = useState<Record<string, ArgentinaQuote>>({});
  const [instruments, setInstruments] = useState<ArgentinaInstrument[]>([]);
  const [sources, setSources] = useState<ArgentinaSourceStatus[]>([]);

  useEffect(() => {
    let active = true;

    async function loadArgentinaData() {
      try {
        const [quotesResponse, instrumentsResponse, statusResponse] = await Promise.all([
          fetch(`/api/argentina/quotes?symbols=${argentinaTableSymbols.join(",")}`),
          fetch("/api/argentina/instruments"),
          fetch("/api/argentina/status"),
        ]);
        if (!active) return;
        if (quotesResponse.ok) {
          const data = (await quotesResponse.json()) as { quotes?: Record<string, ArgentinaQuote> };
          setQuotes(data.quotes ?? {});
        }
        if (instrumentsResponse.ok) {
          const data = (await instrumentsResponse.json()) as { instruments?: ArgentinaInstrument[] };
          setInstruments(data.instruments ?? []);
        }
        if (statusResponse.ok) {
          const data = (await statusResponse.json()) as { sources?: ArgentinaSourceStatus[] };
          setSources(data.sources ?? []);
        }
      } catch {
        if (active) {
          setQuotes({});
          setInstruments([]);
          setSources([]);
        }
      }
    }

    void loadArgentinaData();
    return () => {
      active = false;
    };
  }, []);

  const tableInstruments = argentinaTableSymbols
    .map((symbol) => instruments.find((instrument) => instrument.symbol === symbol))
    .filter((instrument): instrument is ArgentinaInstrument => Boolean(instrument));

  function renderInstrumentCard(symbol: string) {
    const instrument = instruments.find((item) => item.symbol === symbol);
    if (!instrument) return null;
    const quote = quotes[symbol];
    const price = quote?.price === null || quote?.price === undefined ? "N/D" : formatCurrencyValue(quote.price, quote.currency, language);
    const change = typeof quote?.changePercent === "number" ? formatPercent(quote.changePercent) : "N/D";
    const source = argentinaSourceLabel(quote?.source ?? instrument.sourceStatus, isSpanish);

    return (
      <Link
        key={symbol}
        href={`/asset/${encodeURIComponent(symbol)}`}
        className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/35 hover:bg-cyan-300/10"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-white">{instrument.displaySymbol}</p>
            <p className="mt-1 line-clamp-1 text-xs text-slate-400">{instrument.name}</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-slate-300">
            {instrument.type.replaceAll("_", " ")}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{isSpanish ? "Precio" : "Price"}</p>
            <p className="mt-1 font-semibold text-slate-100">{price}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{isSpanish ? "Variacion" : "Change"}</p>
            <p className="mt-1 font-semibold text-slate-100">{change}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-xs text-cyan-100">
            {source}
          </span>
          <span className="text-xs text-slate-500">{quote?.lastUpdated ?? (isSpanish ? "Sin fecha" : "No timestamp")}</span>
        </div>
        <span className="mt-4 inline-flex text-sm font-semibold text-cyan-100">{isSpanish ? "Abrir analisis" : "Open analysis"}</span>
      </Link>
    );
  }

  return (
    <AppShell background="argentina">
      <div className="space-y-8 py-6">
        <section className="cma-panel-elevated cma-glow-violet p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">
            {isSpanish ? "Modulo Argentina" : "Argentina module"}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            {isSpanish ? "Mercado argentino" : "Argentina Market"}
          </h1>
          <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-300">
            {isSpanish
              ? "Esta página centraliza analítica específica de Argentina: acciones, CEDEARs, bonos soberanos, instrumentos CER, referencias MEP/CCL e integraciones futuras con BYMA, IOL y CNV."
              : "This page centralizes Argentina-specific analytics: equities, CEDEARs, sovereign bonds, CER-linked instruments, MEP/CCL references and future BYMA, IOL and CNV integrations."}
          </p>
        </section>
        <MarketHeatmap defaultSegment="argentina" />
        <section className="cma-panel cma-card-argentina p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
            {isSpanish ? "Panel local" : "Local panel"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {isSpanish ? "Panorama local de mercado" : "Local market snapshot"}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
            {isSpanish
              ? "Panel inicial para comparar precios locales, variacion, fuente y fecha disponible por instrumento."
              : "Initial panel for comparing local prices, variation, source and available timestamp by instrument."}
          </p>
          <div className="mt-5 space-y-6">
            {localMarketSections.map((section) => (
              <div key={section.key}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-white">{isSpanish ? section.es : section.en}</h3>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-400">{section.symbols.length}</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{section.symbols.map(renderInstrumentCard)}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="cma-panel cma-card-argentina p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
            {isSpanish ? "Capa CNV" : "CNV layer"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {isSpanish ? "Emisoras registradas" : "Registered issuers"}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
            {isSpanish
              ? "Los documentos y hechos relevantes se incorporaran solo desde una fuente CNV oficial o publica autorizada."
              : "Documents and relevant events will be added only from an official CNV or authorized public source."}
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {cnvIssuers.slice(0, 4).map((issuer) => (
              <CnvIssuerCard key={issuer.symbol} issuer={issuer} />
            ))}
          </div>
        </section>
        <section className="cma-panel cma-card-argentina p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
            {isSpanish ? "Capa de datos local" : "Local data layer"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {isSpanish ? "Cobertura de datos Argentina" : "Argentina data coverage"}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
            {isSpanish
              ? "La capa Argentina prioriza fuentes locales configuradas y cargas manuales validadas. Cuando ninguna fuente responde, informa N/D."
              : "The Argentina layer prioritizes configured local sources and validated manual loads. When no source responds, it reports N/A."}
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {sources.map((source) => (
              <article key={source.source} className="cma-card-argentina p-3">
                <p className="text-sm font-semibold text-white">{argentinaSourceLabel(source.source, isSpanish)}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">{source.mode}</p>
                <p className="mt-2 text-xs leading-5 text-slate-400">{source.notes}</p>
              </article>
            ))}
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-[860px] w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Symbol</th>
                  <th className="px-3 py-3">{isSpanish ? "Nombre" : "Name"}</th>
                  <th className="px-3 py-3">{isSpanish ? "Tipo" : "Type"}</th>
                  <th className="px-3 py-3">{isSpanish ? "Precio" : "Price"}</th>
                  <th className="px-3 py-3">{isSpanish ? "Fuente" : "Source"}</th>
                  <th className="px-3 py-3">{isSpanish ? "Actualizado" : "Updated"}</th>
                  <th className="px-3 py-3">{isSpanish ? "Perfil" : "Profile"}</th>
                </tr>
              </thead>
              <tbody>
                {tableInstruments.map((instrument) => {
                  const quote = quotes[instrument.symbol];
                  return (
                    <tr key={instrument.symbol} className="border-b border-white/10 last:border-b-0">
                      <td className="px-3 py-3 font-semibold text-white">{instrument.displaySymbol}</td>
                      <td className="px-3 py-3 text-slate-300">{instrument.name}</td>
                      <td className="px-3 py-3 text-slate-400">{instrument.type.replaceAll("_", " ")}</td>
                      <td className="px-3 py-3 text-slate-300">
                        {quote?.price === null || quote?.price === undefined
                          ? "N/D"
                          : formatCurrencyValue(quote.price, quote.currency, language)}
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-xs text-cyan-100">
                          {argentinaSourceLabel(quote?.source ?? instrument.sourceStatus, isSpanish)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-500">
                        {quote?.lastUpdated ?? (isSpanish ? "Sin fecha" : "No timestamp")}
                      </td>
                      <td className="px-3 py-3">
                        <Link href={`/asset/${encodeURIComponent(instrument.symbol)}`} className="text-cyan-100 hover:text-white">
                          {isSpanish ? "Abrir" : "Open"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {isSpanish
              ? `Instrumentos registrados: ${formatNumber(instruments.length, language)}. Las cargas manuales no son tiempo real.`
              : `Registered instruments: ${formatNumber(instruments.length, language)}. Manual loads are not real-time.`}
          </p>
        </section>
        <ArgentinaMarket />
        <FixedIncomeComparison />
        <BondSpeciesGuide />
        <InstrumentUniverseGroups argentinaOnly />
        <section className="cma-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
            {isSpanish ? "Universo de instrumentos" : "Instrument universe"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {isSpanish ? "Universo registrado" : "Registered universe"}
          </h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {universeGroups.map((group) => {
              const instruments = group.symbols
                .map((symbol) => ARGENTINA_INSTRUMENT_UNIVERSE.find((item) => item.symbol === symbol))
                .filter(Boolean);

              return (
                <article key={group.key} className="cma-card-argentina p-4">
                  <h3 className="font-semibold text-white">{isSpanish ? group.es : group.en}</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {instruments.map((instrument) => (
                      <span
                        key={instrument?.symbol}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-slate-300"
                      >
                        {instrument?.symbol}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
          <p className="mt-5 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">
            {isSpanish
              ? "Este catalogo define los instrumentos buscables. La disponibilidad de cada cotizacion depende de la respuesta efectiva del proveedor local."
              : "This catalog defines searchable instruments. Quote availability depends on the effective response from the local provider."}
          </p>
          <Link
            href="/screener?country=AR"
            className="mt-4 inline-flex rounded-lg border border-violet-300/30 bg-violet-300/10 px-3 py-2 text-sm font-medium text-violet-100 transition hover:bg-violet-300/15 hover:text-white"
          >
            {isSpanish ? "Explorar instrumentos argentinos" : "Explore Argentine instruments"}
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
