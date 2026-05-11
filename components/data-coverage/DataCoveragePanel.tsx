"use client";

import { useLanguage } from "@/lib/i18n/useLanguage";
import { DataCoverageBadges } from "./DataCoverageBadges";

export function DataCoveragePanel({ symbol }: { symbol: string }) {
  const { language } = useLanguage();
  const isSpanish = language === "es";

  return (
    <section className="rounded-lg border border-white/10 bg-slate-950/55 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {isSpanish ? "Cobertura de datos" : "Data coverage"}
      </p>
      <DataCoverageBadges symbol={symbol} />
    </section>
  );
}
