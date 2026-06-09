"use client";

import { useLanguage } from "@/lib/i18n/useLanguage";
import type { CnvDocumentType } from "@/lib/cnv";

const typeLabels: Record<CnvDocumentType, { en: string; es: string }> = {
  financial_statement: { en: "Financial statement", es: "Estados financieros" },
  relevant_event: { en: "Relevant event", es: "Hechos relevantes" },
  annual_report: { en: "Annual report", es: "Memoria anual" },
  board_decision: { en: "Board decision", es: "Decision societaria" },
  corporate_action: { en: "Corporate action", es: "Evento corporativo" },
  prospectus: { en: "Prospectus", es: "Prospecto" },
  rating: { en: "Rating", es: "Calificacion" },
  other: { en: "Other", es: "Otro" },
};

export function CnvDocumentBadge({ type }: { type: CnvDocumentType }) {
  const { language } = useLanguage();

  return (
    <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-2.5 py-1 text-xs font-medium text-violet-100">
      {typeLabels[type]?.[language] ?? type}
    </span>
  );
}
