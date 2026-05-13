"use client";

import Link from "next/link";
import { ArgentinaMarket } from "@/components/dashboard/ArgentinaMarket";
import { BondSpeciesGuide } from "@/components/fixed-income/BondSpeciesGuide";
import { FixedIncomeComparison } from "@/components/fixed-income/FixedIncomeComparison";
import { AppShell } from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { InstrumentUniverseGroups } from "@/components/screener/InstrumentUniverseGroups";
import { ARGENTINA_INSTRUMENT_UNIVERSE } from "@/lib/instrument-universe";

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

export default function ArgentinaPage() {
  const { language } = useLanguage();
  const isSpanish = language === "es";

  return (
    <AppShell>
      <div className="space-y-8 py-6">
        <section className="rounded-lg border border-violet-300/20 bg-slate-900/70 p-6 backdrop-blur">
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
        <ArgentinaMarket />
        <FixedIncomeComparison />
        <BondSpeciesGuide />
        <InstrumentUniverseGroups argentinaOnly />
        <section className="rounded-lg border border-white/10 bg-white/[0.045] p-5 backdrop-blur">
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
                <article key={group.key} className="rounded-lg border border-white/10 bg-slate-950/45 p-4">
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
