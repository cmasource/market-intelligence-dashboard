"use client";

import { DataCoveragePanel } from "@/components/data-coverage/DataCoveragePanel";
import { DataTransparencyNote } from "@/components/data-coverage/DataTransparencyNote";
import { CnvDocumentsPanel } from "@/components/cnv/CnvDocumentsPanel";
import { CnvIssuerCard } from "@/components/cnv/CnvIssuerCard";
import { getCnvDocumentsForSymbol, getCnvIssuer } from "@/lib/cnv";
import { useLanguage } from "@/lib/i18n/useLanguage";

export function AssetSecondaryDetails({ symbol }: { symbol: string }) {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const cnvIssuer = getCnvIssuer(symbol);
  const cnvDocuments = cnvIssuer ? getCnvDocumentsForSymbol(symbol) : [];

  return (
    <section className="cma-panel p-5">
      <p className="cma-kicker">{isSpanish ? "Detalle" : "Details"}</p>
      <h2 className="mt-2 text-xl font-semibold text-white">
        {isSpanish ? "Detalle secundario" : "Secondary detail zone"}
      </h2>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {cnvIssuer ? (
          <>
            <CnvIssuerCard issuer={cnvIssuer} />
            <CnvDocumentsPanel documents={cnvDocuments} compact />
          </>
        ) : null}
        <details className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <summary className="cursor-pointer font-semibold text-white">
            {isSpanish ? "Detalle tecnico" : "Technical detail"}
          </summary>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {isSpanish
              ? "Los factores tecnicos se resumen en el motor principal. Usar el grafico y las barras de factores como contexto."
              : "Technical factors are summarized in the main technical engine. Use the chart and factor bars together for context."}
          </p>
        </details>
        <details className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <summary className="cursor-pointer font-semibold text-white">
            {isSpanish ? "Detalle fundamental" : "Fundamental detail"}
          </summary>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {isSpanish
              ? "Los datos disponibles se muestran primero; los campos no disponibles quedan agrupados dentro del modulo fundamental."
              : "Available fundamentals are shown first; unavailable provider fields remain grouped inside the fundamental module."}
          </p>
        </details>
        <DataCoveragePanel symbol={symbol} />
        <DataTransparencyNote />
      </div>
    </section>
  );
}

