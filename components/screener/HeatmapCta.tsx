"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/useLanguage";

export function HeatmapCta() {
  const { language } = useLanguage();
  const isSpanish = language === "es";

  return (
    <section className="cma-panel cma-glow-cyan p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="cma-kicker">{isSpanish ? "Mapa de calor" : "Heatmap"}</p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {isSpanish ? "Explorar movimientos por segmento" : "Explore moves by segment"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            {isSpanish
              ? "Usa el mapa de calor para comparar USA, CEDEARs, Argentina, bonos, cripto y ETFs antes de abrir un analisis puntual."
              : "Use the heatmap to compare USA, CEDEARs, Argentina, bonds, crypto and ETFs before opening a specific analysis."}
          </p>
        </div>
        <Link
          href="/markets#market-heatmap"
          className="inline-flex w-fit rounded-xl border border-cyan-300/35 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/15 hover:text-white"
        >
          {isSpanish ? "Abrir mapa de calor" : "Open heatmap"}
        </Link>
      </div>
    </section>
  );
}
