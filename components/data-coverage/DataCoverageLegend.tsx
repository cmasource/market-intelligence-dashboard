"use client";

import { useLanguage } from "@/lib/i18n/useLanguage";

export function DataCoverageLegend() {
  const { language } = useLanguage();
  const isSpanish = language === "es";

  const items = [
    {
      label: isSpanish ? "Real / proveedor" : "Real / provider",
      className: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
    },
    {
      label: isSpanish ? "Simulado" : "Mock",
      className: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
    },
    {
      label: isSpanish ? "Futuro" : "Future",
      className: "border-violet-300/25 bg-violet-300/10 text-violet-100",
    },
    {
      label: isSpanish ? "No aplica" : "Not applicable",
      className: "border-slate-500/25 bg-slate-500/10 text-slate-300",
    },
  ];

  return (
    <section className="rounded-lg border border-white/10 bg-slate-950/55 p-5 backdrop-blur">
      <h2 className="text-lg font-semibold text-white">
        {isSpanish ? "Origen y cobertura de datos" : "Data provenance and coverage"}
      </h2>
      <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
        {isSpanish
          ? "Los datos reales/de proveedor estan disponibles actualmente para instrumentos seleccionados de Estados Unidos y cripto. Los instrumentos argentinos y CEDEARs usan datos simulados o cobertura futura hasta habilitar integraciones de mercado local."
          : "Real/provider data is currently available for selected USA and crypto instruments. Argentine market instruments and CEDEARs use mock or future coverage until local market data integrations are enabled."}
      </p>
      <p className="mt-2 text-xs text-slate-500">
        {isSpanish
          ? "Indica si los datos provienen de proveedor real, fallback simulado o cobertura futura."
          : "Shows whether data comes from a real provider, mock fallback or future coverage."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item.label} className={`rounded-full border px-3 py-1 text-xs font-medium ${item.className}`}>
            {item.label}
          </span>
        ))}
      </div>
    </section>
  );
}
