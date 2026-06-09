"use client";

import { CnvDocumentBadge } from "@/components/cnv/CnvDocumentBadge";
import { useLanguage } from "@/lib/i18n/useLanguage";
import type { CnvDocument } from "@/lib/cnv";

function sourceLabel(document: CnvDocument, isSpanish: boolean) {
  if (document.source === "structured_demo") {
    return isSpanish ? "Documento estructurado de demostracion" : "Structured demo document";
  }
  if (document.source === "cnv_future") return isSpanish ? "Integracion CNV futura" : "Future CNV integration";
  if (document.source === "manual") return isSpanish ? "Carga manual" : "Manual load";
  return isSpanish ? "No disponible" : "Unavailable";
}

export function CnvDocumentsPanel({ documents, compact = false }: { documents: CnvDocument[]; compact?: boolean }) {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const visibleDocuments = documents.slice(0, compact ? 3 : 6);

  return (
    <section className="cma-card-analysis p-4" data-testid="cnv-documents-panel">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="cma-kicker">{isSpanish ? "Documentos societarios" : "Corporate documents"}</p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            {isSpanish ? "Documentos societarios CNV" : "CNV corporate documents"}
          </h3>
        </div>
        <span className="w-fit rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-xs text-violet-100">
          {isSpanish ? "Integracion CNV futura" : "Future CNV integration"}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        {isSpanish
          ? "Documentacion societaria estructurada de demostracion hasta integracion CNV real."
          : "Structured demo corporate documentation until real CNV integration is enabled."}
      </p>

      {visibleDocuments.length ? (
        <div className="mt-4 space-y-3">
          {visibleDocuments.map((document) => (
            <article key={document.id} className="rounded-xl border border-white/10 bg-slate-950/35 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CnvDocumentBadge type={document.documentType} />
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-300">
                      {sourceLabel(document, isSpanish)}
                    </span>
                  </div>
                  <h4 className="mt-3 text-sm font-semibold text-white">{document.title}</h4>
                  <p className="mt-1 text-xs text-slate-500">
                    {document.issuerName} | {document.publishedAt}
                    {document.period ? ` | ${document.period}` : ""}
                  </p>
                </div>
                {document.url ? (
                  <a
                    href={document.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-cyan-100 hover:text-white"
                  >
                    {isSpanish ? "Abrir documento" : "Open document"}
                  </a>
                ) : null}
              </div>
              {document.summary ? <p className="mt-3 text-xs leading-5 text-slate-400">{document.summary}</p> : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-3 text-sm text-slate-400">
          {isSpanish
            ? "No hay documentos estructurados para esta emisora. La integracion CNV queda marcada como futura."
            : "No structured documents are available for this issuer. CNV integration remains future-scoped."}
        </p>
      )}
    </section>
  );
}
