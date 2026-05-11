"use client";

import { AppShell } from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { sectionAccents } from "@/lib/ui/section-accents";

const reports = {
  en: [
    "Daily market briefings",
    "Asset reports",
    "Argentina fixed income reports",
    "Crypto and arbitrage reports",
    "AI-generated PDF reports",
  ],
  es: [
    "Informes diarios de mercado",
    "Reportes por activo",
    "Reportes de renta fija argentina",
    "Reportes cripto y arbitrajes",
    "Reportes PDF generados con IA",
  ],
};

export default function ReportsPage() {
  const { language } = useLanguage();
  const isSpanish = language === "es";

  return (
    <AppShell>
      <div className="space-y-8 py-6">
        <section className="rounded-lg border border-violet-300/20 bg-slate-900/70 p-6 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">
            CMA Market Intelligence
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            {isSpanish ? "Reportes" : "Reports"}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            {isSpanish
              ? "Estructura preparada para reportes consultivos y documentos de mercado generados con IA."
              : "Prepared structure for consultant-ready reporting and AI-generated market documents."}
          </p>
        </section>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {reports[language].map((report) => (
            <article key={report} className={`rounded-lg border p-4 backdrop-blur ${sectionAccents.reports.card}`}>
              <p className="text-sm font-semibold text-white">{report}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.14em] text-fuchsia-200">
                {isSpanish ? "Proximamente" : "Coming soon"}
              </p>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
