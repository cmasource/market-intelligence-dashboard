"use client";

import { useLanguage } from "@/lib/i18n/useLanguage";
import type { CnvIssuer } from "@/lib/cnv";

function sourceStatusLabel(status: CnvIssuer["sourceStatus"], isSpanish: boolean) {
  if (status === "manual") return isSpanish ? "Carga manual" : "Manual load";
  if (status === "mock") return isSpanish ? "Demo estructurada" : "Structured demo";
  if (status === "future") return isSpanish ? "Integracion CNV futura" : "Future CNV integration";
  return isSpanish ? "No disponible" : "Unavailable";
}

export function CnvIssuerCard({ issuer }: { issuer: CnvIssuer }) {
  const { language } = useLanguage();
  const isSpanish = language === "es";

  return (
    <article className="cma-card-argentina p-4" data-testid={`cnv-issuer-${issuer.symbol}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="cma-kicker">{isSpanish ? "Emisora CNV" : "CNV issuer"}</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{issuer.issuerName}</h3>
          <p className="mt-1 text-sm text-slate-400">
            {issuer.symbol} | {issuer.market}
            {issuer.sector ? ` | ${issuer.sector}` : ""}
          </p>
        </div>
        <span className="w-fit rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
          {sourceStatusLabel(issuer.sourceStatus, isSpanish)}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        {isSpanish
          ? "Perfil de emisora local preparado para futura integracion con documentos CNV oficiales o fuentes publicas autorizadas."
          : "Local issuer profile prepared for future integration with official CNV documents or authorized public sources."}
      </p>
      {issuer.relatedAdr || issuer.relatedCedears?.length ? (
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
          {issuer.relatedAdr ? (
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">ADR: {issuer.relatedAdr}</span>
          ) : null}
          {issuer.relatedCedears?.map((cedear) => (
            <span key={cedear} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
              CEDEAR: {cedear}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
