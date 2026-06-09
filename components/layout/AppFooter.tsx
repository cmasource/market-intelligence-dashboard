"use client";

import Image from "next/image";
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
    <footer className={`border-t ${isLight ? "border-slate-200 bg-white/82 text-slate-700" : "border-white/10 bg-slate-950/86 text-slate-400"} backdrop-blur`}>
      <div className="mx-auto grid max-w-[1520px] gap-6 px-4 py-7 text-sm sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-10">
        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className={`relative h-10 w-40 overflow-hidden rounded-lg border px-3 py-1.5 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-white"}`}>
              <Image
                src="/brand/cma-consulting-header-transparent.png"
                alt="CMA Consulting"
                width={622}
                height={144}
                className="h-full w-full object-contain"
              />
            </div>
            <div className={`hidden h-8 w-px sm:block ${isLight ? "bg-slate-200" : "bg-white/10"}`} />
            <div className={`relative h-8 w-32 overflow-hidden rounded-lg border px-2 py-1 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-white"}`}>
              <Image
                src="/brand/cma-source-horizontal-transparent.png"
                alt="cma_source"
                width={622}
                height={144}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className={`font-semibold ${isLight ? "text-slate-950" : "text-white"}`}>CMA Market Intelligence</p>
              <p className="mt-1 text-xs leading-5">
                {isSpanish ? "Producto por CMA Consulting." : "Product by CMA Consulting."}{" "}
                <span className={isLight ? "text-slate-500" : "text-slate-500"}>
                  {isSpanish ? "Desarrollado por cma_source." : "Developed by cma_source."}
                </span>
              </p>
            </div>
          </div>
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
