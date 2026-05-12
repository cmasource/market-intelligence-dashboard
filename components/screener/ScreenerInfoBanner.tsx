"use client";

import { useLanguage } from "@/lib/i18n/useLanguage";
import { useTheme } from "@/lib/theme/useTheme";

export function ScreenerInfoBanner() {
  const { language } = useLanguage();
  const { resolvedMode } = useTheme();
  const isSpanish = language === "es";
  const isLight = resolvedMode === "light";

  return (
    <section
      className={`rounded-lg border p-4 text-sm leading-6 ${
        isLight
          ? "border-cyan-800/20 bg-cyan-50/90 text-slate-800 shadow-lg shadow-slate-900/5"
          : "border-cyan-300/20 bg-cyan-300/10 text-cyan-50"
      }`}
    >
      <p className={isLight ? "text-slate-800" : "text-cyan-50"}>
        {isSpanish
          ? "El screener permite explorar el universo actual de instrumentos. Algunos ya cuentan con datos reales/proveedor y otros estan marcados como cobertura futura."
          : "The screener lets users explore the current instrument universe. Some assets already have real/provider data while others are marked as future coverage."}
      </p>
    </section>
  );
}
