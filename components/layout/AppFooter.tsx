"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { useTheme } from "@/lib/theme/useTheme";

const footerLinks = [
  { href: "/markets", en: "Markets", es: "Mercados" },
  { href: "/screener", en: "Screener", es: "Screener" },
  { href: "/argentina", en: "Argentina", es: "Argentina" },
  { href: "/crypto", en: "Crypto", es: "Cripto" },
  { href: "/data-audit", en: "Data Audit", es: "Auditoría" },
  { href: "/methodology", en: "Methodology", es: "Metodología" },
  { href: "/glossary", en: "Glossary", es: "Glosario" },
  { href: "/status", en: "Status", es: "Estado" },
];

export function AppFooter() {
  const { language } = useLanguage();
  const { resolvedMode } = useTheme();
  const isSpanish = language === "es";
  const isLight = resolvedMode === "light";

  return (
    <footer className={`border-t ${isLight ? "border-slate-200 bg-white/75 text-slate-700" : "border-white/10 bg-slate-950/75 text-slate-400"} backdrop-blur`}>
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 text-sm sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-8">
        <div>
          <p className={`font-semibold ${isLight ? "text-slate-950" : "text-white"}`}>CMA Market Intelligence</p>
          <p className="mt-2">CMA Consulting</p>
          <p>{isSpanish ? "Desarrollado por cma_source" : "Developed by cma_source"}</p>
          <p
            className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
              isLight
                ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                : "border-cyan-300/25 bg-cyan-300/10 text-cyan-100"
            }`}
          >
            {isSpanish
              ? "Demo publica - datos reales, proveedor, simulados y cobertura futura."
              : "Public demo - real, provider, mock and future coverage."}
          </p>
          <p className="mt-3 max-w-3xl leading-6">
            {isSpanish
              ? "Esta plataforma brinda analisis informativo y no constituye asesoramiento financiero personalizado ni recomendacion de inversion."
              : "This platform provides informational analysis only and does not constitute personalized financial advice or an investment recommendation."}
          </p>
          <p className="mt-2 max-w-3xl leading-6">
            {isSpanish
              ? "Algunos datos provienen de proveedores publicos, otros son simulados o corresponden a cobertura futura."
              : "Some data comes from public providers, while other data is simulated or marked as future coverage."}
          </p>
          <p className="mt-2 max-w-3xl leading-6">
            {isSpanish
              ? "Demo en evolucion. Las sugerencias y el feedback se usaran para priorizar proximas mejoras."
              : "Demo in progress. Feedback will be used to prioritize upcoming improvements."}
          </p>
        </div>
        <nav aria-label={isSpanish ? "Navegacion secundaria" : "Secondary navigation"} className="flex flex-wrap items-start gap-2 lg:justify-end">
          {footerLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full border px-3 py-1.5 transition ${
                isLight
                  ? "border-slate-200 bg-slate-50 text-slate-700 hover:border-cyan-400 hover:text-slate-950"
                  : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-cyan-300/40 hover:text-white"
              }`}
            >
              {isSpanish ? item.es : item.en}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
