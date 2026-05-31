"use client";

import { useLanguage } from "@/lib/i18n/useLanguage";
import { DataCoverageBadges } from "./DataCoverageBadges";

export function DataCoveragePanel({ symbol }: { symbol: string }) {
  const { language } = useLanguage();
  const isSpanish = language === "es";

  return (
    <section id="asset-coverage" className="cma-panel p-4">
      <details>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
          <span>
            <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {isSpanish ? "Cobertura de datos" : "Data coverage"}
            </span>
            <span className="mt-1 block text-sm text-slate-300">
              {isSpanish ? "Ver cobertura de datos" : "View data coverage"}
            </span>
          </span>
          <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
            {isSpanish ? "Transparencia" : "Transparency"}
          </span>
        </summary>
        <div className="mt-4 space-y-4">
          <DataCoverageBadges symbol={symbol} />
          <p className="text-xs leading-5 text-slate-500">
            {isSpanish
              ? "La cobertura se muestra como contexto secundario para distinguir proveedor, respaldo, simulacion y cobertura futura sin competir con la lectura de mercado."
              : "Coverage is shown as secondary context to distinguish provider, fallback, mock and future layers without overpowering the market reading."}
          </p>
        </div>
      </details>
    </section>
  );
}
