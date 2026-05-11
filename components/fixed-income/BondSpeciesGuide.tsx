"use client";

import { getBondSpeciesDisplayLabel, getRelatedBondSpecies, getUnderlyingBondSymbol } from "@/lib/fixed-income";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { SectionHeader } from "../ui/SectionHeader";

const speciesRows = [
  { symbol: "AL30", currency: "ARS" },
  { symbol: "AL30D", currency: "USD MEP" },
  { symbol: "AL30C", currency: "USD CABLE" },
  { symbol: "GD30", currency: "ARS" },
  { symbol: "GD30D", currency: "USD MEP" },
  { symbol: "GD30C", currency: "USD CABLE" },
  { symbol: "TX26", currency: "ARS CER" },
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
            ? "En el mercado argentino, un mismo bono puede negociarse mediante distintas especies. Por ejemplo, AL30 representa la especie en pesos, AL30D la especie dolar MEP y AL30C la especie dolar cable/CCL. Todas refieren al mismo bono subyacente, pero tienen distinta moneda y modalidad de negociacion."
            : "In the Argentine market, the same underlying bond can trade through different species. For example, AL30 represents the peso trading species, AL30D the dollar MEP species and AL30C the dollar cable/CCL species. They refer to the same underlying bond but differ in trading currency and settlement context."
        }
      />

      <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.035]">
        <div className="grid grid-cols-[0.8fr_1fr_1.4fr_0.9fr] gap-3 border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-500">
          <span>Symbol</span>
          <span>{isSpanish ? "Bono subyacente" : "Underlying bond"}</span>
          <span>{isSpanish ? "Especie" : "Trading species"}</span>
          <span>{isSpanish ? "Moneda" : "Currency"}</span>
        </div>
        {speciesRows.map((row) => (
          <div
            key={row.symbol}
            className="grid grid-cols-[0.8fr_1fr_1.4fr_0.9fr] gap-3 border-b border-white/5 px-4 py-3 text-sm last:border-b-0"
          >
            <span className="font-semibold text-white">{row.symbol}</span>
            <span className="text-slate-300">{getUnderlyingBondSymbol(row.symbol)}</span>
            <span className="text-slate-300">{getBondSpeciesDisplayLabel(row.symbol, language)}</span>
            <span className="text-slate-300">{row.currency}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">
        {isSpanish
          ? "Los valores actuales de renta fija argentina usan datos estructurados simulados hasta habilitar integracion con BYMA, IOL o proveedores licenciados."
          : "Current Argentina fixed income values use mock structured data until BYMA, IOL or licensed market data integration is enabled."}
      </p>
      <p className="mt-3 text-xs text-slate-500">
        {isSpanish ? "Especies relacionadas AL30: " : "Related AL30 species: "}
        {getRelatedBondSpecies("AL30").join(", ")}
      </p>
    </section>
  );
}
