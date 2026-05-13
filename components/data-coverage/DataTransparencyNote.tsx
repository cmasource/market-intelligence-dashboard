"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/useLanguage";

export function DataTransparencyNote() {
  const { language } = useLanguage();
  const isSpanish = language === "es";

  return (
    <section className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm leading-6 text-slate-300">
      <p>
        {isSpanish
          ? "Los precios de instrumentos argentinos son simulados hasta contar con integración real de mercado. En bonos, el precio visible puede diferenciarse del precio normalizado usado para métricas analíticas."
          : "Argentine instrument prices are simulated until real market integration is available. For bonds, the visible price may differ from the normalized price used for analytical metrics."}
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <Link href="/data-audit" className="text-sm font-medium text-cyan-100 hover:text-white">
          {isSpanish ? "Ver auditoría de datos" : "View data audit"}
        </Link>
        <Link href="/methodology" className="text-sm font-medium text-cyan-100 hover:text-white">
          {isSpanish ? "Ver metodología" : "View methodology"}
        </Link>
      </div>
    </section>
  );
}
