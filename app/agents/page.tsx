"use client";

import { AppShell } from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { sectionAccents } from "@/lib/ui/section-accents";

const agents = {
  en: [
    "Technical analysis agent",
    "Fundamentals agent",
    "News agent",
    "Fixed income agent",
    "Arbitrage agent",
    "Report generation agent",
  ],
  es: [
    "Agente de analisis tecnico",
    "Agente de fundamentos",
    "Agente de noticias",
    "Agente de renta fija",
    "Agente de arbitrajes",
    "Agente generador de reportes",
  ],
};

export default function AgentsPage() {
  const { language } = useLanguage();
  const isSpanish = language === "es";

  return (
    <AppShell>
      <div className="space-y-8 py-6">
        <section className="rounded-lg border border-cyan-300/20 bg-slate-900/70 p-6 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
            CMA Market Intelligence
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            {isSpanish ? "Agentes IA" : "AI Agents"}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            {isSpanish
              ? "Futura capa de agentes para analisis, noticias, renta fija, arbitrajes y generacion de reportes."
              : "Future agent layer for analysis, news, fixed income, arbitrage and report generation."}
          </p>
        </section>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agents[language].map((agent) => (
            <article key={agent} className={`rounded-lg border p-5 ${sectionAccents.ai.card}`}>
              <p className="font-semibold text-white">{agent}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.14em] text-violet-200">
                {isSpanish ? "Proximamente" : "Coming soon"}
              </p>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
