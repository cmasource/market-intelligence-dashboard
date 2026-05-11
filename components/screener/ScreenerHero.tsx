"use client";

import { useLanguage } from "@/lib/i18n/useLanguage";

export function ScreenerHero() {
  const { language } = useLanguage();
  const isSpanish = language === "es";

  return (
    <section className="rounded-lg border border-cyan-300/20 bg-slate-900/70 p-6 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
        CMA Market Intelligence
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
        {isSpanish ? "Screener de instrumentos" : "Instrument Screener"}
      </h1>
      <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-300">
        {isSpanish
          ? "Explora el universo actual de instrumentos simulados y con datos reales disponibles. Futuras versiones ampliaran la cobertura a BYMA, CEDEARs, bonos, ONs, letras, lecaps y criptoactivos."
          : "Explore the current mock and real-supported instrument universe. Future versions will expand coverage to BYMA, CEDEARs, bonds, ONs, letras, lecaps and crypto assets."}
      </p>
    </section>
  );
}
