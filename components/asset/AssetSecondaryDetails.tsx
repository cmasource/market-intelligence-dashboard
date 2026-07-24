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
      <p className="cma-kicker">{isSpanish ? "Transparencia" : "Transparency"}</p>
      <h2 className="mt-2 text-xl font-semibold text-white">
        {isSpanish ? "Cobertura y fuentes" : "Coverage and sources"}
      </h2>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {cnvIssuer ? (
          <>
            <CnvIssuerCard issuer={cnvIssuer} />
            <CnvDocumentsPanel documents={cnvDocuments} compact />
          </>
        ) : null}
        <DataCoveragePanel symbol={symbol} />
        <DataTransparencyNote />
      </div>
    </section>
  );
}

