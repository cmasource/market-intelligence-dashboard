"use client";

import { getBondSpeciesDisplayLabel, getRelatedBondSpecies, getUnderlyingBondSymbol } from "@/lib/fixed-income";
import { formatDisplayCurrency } from "@/lib/formatters";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { SectionHeader } from "../ui/SectionHeader";

const speciesRows = [
  { symbol: "AL30", quoteCurrency: "ARS", contextEs: "Pesos", contextEn: "Pesos" },
  { symbol: "AL30D", quoteCurrency: "USD", contextEs: "Dólar MEP", contextEn: "Dollar MEP" },
  { symbol: "AL30C", quoteCurrency: "USD", contextEs: "Dólar cable/CCL", contextEn: "Dollar cable/CCL" },
  { symbol: "GD30", quoteCurrency: "ARS", contextEs: "Pesos", contextEn: "Pesos" },
  { symbol: "GD30D", quoteCurrency: "USD", contextEs: "Dólar MEP", contextEn: "Dollar MEP" },
  { symbol: "GD30C", quoteCurrency: "USD", contextEs: "Dólar cable/CCL", contextEn: "Dollar cable/CCL" },
  { symbol: "TX26", quoteCurrency: "ARS", contextEs: "Ajustado por CER", contextEn: "CER-linked" },
];

export function BondSpeciesGuide() {
  const { language } = useLanguage();
  const isSpanish = language === "es";

  return (
    <section className="rounded-lg border border-violet-300/20 bg-slate-950/55 p-5 backdrop-blur">
      <SectionHeader
        eyebrow={isSpanish ? "Renta fija argentina" : "Argentina fixed income"}
        title={isSpanish ? "Especies de bonos argentinos" : "Argentine bond trading species"}
        description={
          isSpanish
            ? "En el mercado argentino, un mismo bono puede negociarse mediante distintas especies. Por ejemplo, AL30 representa la especie en pesos, AL30D la especie dólar MEP y AL30C la especie dólar cable/CCL. Todas refieren al mismo bono subyacente, pero separan moneda de cotización y contexto de liquidación."
            : "In the Argentine market, the same underlying bond can trade through different species. For example, AL30 represents the peso trading species, AL30D the dollar MEP species and AL30C the dollar cable/CCL species. They refer to the same underlying bond while separating quote currency from settlement context."
        }
      />

      <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.035]">
        <div className="grid grid-cols-[0.75fr_1fr_1.3fr_0.9fr_1.1fr] gap-3 border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500">
          <span>Symbol</span>
          <span>{isSpanish ? "Bono subyacente" : "Underlying bond"}</span>
          <span>{isSpanish ? "Especie" : "Trading species"}</span>
          <span>{isSpanish ? "Cotiza" : "Quote"}</span>
          <span>{isSpanish ? "Contexto" : "Context"}</span>
        </div>
        {speciesRows.map((row) => (
          <div
            key={row.symbol}
            className="grid grid-cols-[0.75fr_1fr_1.3fr_0.9fr_1.1fr] gap-3 border-b border-white/5 px-4 py-3 text-sm last:border-b-0"
          >
            <span className="font-semibold text-white">{row.symbol}</span>
            <span className="text-slate-300">{getUnderlyingBondSymbol(row.symbol)}</span>
            <span className="text-slate-300">{getBondSpeciesDisplayLabel(row.symbol, language)}</span>
            <span className="text-slate-300">{formatDisplayCurrency(row.quoteCurrency, language)}</span>
            <span className="text-slate-300">{isSpanish ? row.contextEs : row.contextEn}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">
        {isSpanish
          ? "Los precios de instrumentos argentinos son simulados hasta contar con integración real de mercado. En bonos, el precio visible puede diferenciarse del precio normalizado usado para métricas analíticas."
          : "Argentine instrument prices are simulated until real market integration is available. For bonds, the visible price may differ from the normalized price used for analytical metrics."}
      </p>
      <p className="mt-3 text-xs text-slate-500">
        {isSpanish ? "Especies relacionadas AL30: " : "Related AL30 species: "}
        {getRelatedBondSpecies("AL30").join(", ")}
      </p>
    </section>
  );
}
