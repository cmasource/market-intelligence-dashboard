"use client";

import { AppShell } from "@/components/layout/AppShell";
import { getGlossaryTermsByCategory, type GlossaryCategory } from "@/lib/glossary";
import { useLanguage } from "@/lib/i18n/useLanguage";

const categories: Array<{ id: GlossaryCategory; en: string; es: string }> = [
  { id: "technical", en: "Technical analysis", es: "Análisis técnico" },
  { id: "fundamentals", en: "Fundamentals", es: "Fundamentos" },
  { id: "fixed_income", en: "Fixed income", es: "Renta fija" },
  { id: "risk", en: "Market/risk", es: "Mercado/riesgo" },
  { id: "market", en: "Market/risk", es: "Mercado/riesgo" },
];

export default function GlossaryPage() {
  const { language } = useLanguage();
  const isSpanish = language === "es";

  return (
    <AppShell>
      <div className="space-y-8 py-6">
        <section className="rounded-lg border border-cyan-300/20 bg-slate-900/70 p-6 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">CMA Market Intelligence</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            {isSpanish ? "Glosario financiero" : "Financial Glossary"}
          </h1>
          <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-300">
            {isSpanish
              ? "Definiciones breves de los principales indicadores técnicos, fundamentales y de renta fija utilizados en CMA Market Intelligence."
              : "Short definitions of the main technical, fundamental and fixed income indicators used in CMA Market Intelligence."}
          </p>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          {categories
            .filter((category, index, all) => all.findIndex((item) => item.id === category.id) === index)
            .map((category) => {
              const terms = getGlossaryTermsByCategory(category.id);
              if (!terms.length) return null;

              return (
                <section key={category.id} className="rounded-lg border border-white/10 bg-slate-950/55 p-5">
                  <h2 className="text-xl font-semibold text-white">{isSpanish ? category.es : category.en}</h2>
                  <div className="mt-4 space-y-3">
                    {terms.map((term) => (
                      <article key={term.key} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                        <h3 className="text-sm font-semibold text-white">{isSpanish ? term.labelEs : term.labelEn}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          {isSpanish ? term.shortDefinitionEs : term.shortDefinitionEn}
                        </p>
                        {term.formula ? <p className="mt-2 font-mono text-xs text-cyan-100">{term.formula}</p> : null}
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
        </div>
      </div>
    </AppShell>
  );
}
