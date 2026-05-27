"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArgentinaMarket } from "@/components/dashboard/ArgentinaMarket";
import { BondSpeciesGuide } from "@/components/fixed-income/BondSpeciesGuide";
import { FixedIncomeComparison } from "@/components/fixed-income/FixedIncomeComparison";
import { AppShell } from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { InstrumentUniverseGroups } from "@/components/screener/InstrumentUniverseGroups";
import { ARGENTINA_INSTRUMENT_UNIVERSE } from "@/lib/instrument-universe";
import { formatCurrencyValue, formatNumber } from "@/lib/formatters";
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

const argentinaTableSymbols = ["GGAL", "YPFD", "AL30", "GD30", "TX26", "AAPL"];

function argentinaSourceLabel(source: string, isSpanish: boolean) {
  if (source === "manual") return isSpanish ? "Carga manual validada" : "Validated manual load";
  if (source === "mock") return isSpanish ? "Dato estructurado simulado" : "Structured mock data";
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
        <section className="cma-panel cma-card-argentina p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
            {isSpanish ? "Capa de datos local" : "Local data layer"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {isSpanish ? "Cobertura de datos Argentina" : "Argentina data coverage"}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
            {isSpanish
              ? "La capa Argentina prioriza cargas manuales validadas, mantiene datos estructurados simulados como respaldo y prepara integraciones futuras con BYMA, CNV y proveedores licenciados."
              : "The Argentina layer prioritizes validated manual loads, keeps structured mock data as fallback and prepares future BYMA, CNV and licensed-provider integrations."}
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
            {isSpanish ? "Cobertura inicial simulada" : "Initial mock coverage"}
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
              ? "Este es un universo inicial simulado. Versiones futuras ampliarán la cobertura al panel líder, panel general, CEDEARs, ONs, letras, lecaps y otros instrumentos de BYMA."
              : "This is an initial mock universe. Future versions will expand coverage to panel lider, general panel, CEDEARs, ONs, letras, lecaps and other BYMA instruments."}
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
