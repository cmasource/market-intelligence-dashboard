"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { AssetIntelligenceReport } from "@/components/intelligence/AssetIntelligenceReport";
import { useLanguage } from "@/lib/i18n/useLanguage";

type ShareableAssetReportPageProps = {
  symbol: string;
};

export function ShareableAssetReportPage({ symbol }: ShareableAssetReportPageProps) {
  const { language } = useLanguage();
  const isSpanish = language === "es";

  const copy = {
    eyebrow: isSpanish ? "Reporte ejecutivo compartible" : "Shareable executive report",
    intro: isSpanish
      ? "Reporte compartible de inteligencia de activos para demos públicas. Este informe combina datos de proveedor, respaldo, simulación y cobertura futura disponibles, y no constituye asesoramiento de inversión."
      : "Shareable asset intelligence report for public demos. This report combines available provider, fallback, mock and future coverage layers and is not investment advice.",
    profile: isSpanish ? "Abrir perfil completo" : "Open full asset page",
    methodology: isSpanish ? "Metodología" : "Methodology",
    audit: isSpanish ? "Auditoría de datos" : "Data audit",
    scopeTitle: isSpanish ? "Alcance del reporte" : "Report scope",
    scopeBody: isSpanish
      ? "CMA Market Intelligence brinda análisis informativo únicamente. Este informe combina datos de proveedor, datos compatibles de respaldo, datos simulados estructurados y cobertura futura; los datos locales de CEDEAR continúan simulados hasta integrar BYMA/IOL o proveedor licenciado."
      : "CMA Market Intelligence provides informational analysis only. This report combines provider data, compatible fallback data, structured mock data and future coverage; local CEDEAR data remains simulated until BYMA/IOL or licensed-provider data is integrated.",
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 py-6">
        <section className="rounded-lg border border-cyan-300/20 bg-slate-900/75 p-5 shadow-xl shadow-cyan-950/10 backdrop-blur sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                CMA Market Intelligence
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{symbol}</h1>
              <p className="mt-4 text-sm leading-6 text-slate-300">{copy.intro}</p>
            </div>

            <div className="flex flex-wrap gap-2 lg:max-w-sm lg:justify-end">
              <Link
                href={`/asset/${encodeURIComponent(symbol)}`}
                className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-200/60 hover:text-white"
              >
                {copy.profile}
              </Link>
              <Link
                href="/methodology"
                className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-white/25 hover:text-white"
              >
                {copy.methodology}
              </Link>
              <Link
                href="/data-audit"
                className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-white/25 hover:text-white"
              >
                {copy.audit}
              </Link>
            </div>
          </div>
        </section>

        <AssetIntelligenceReport symbol={symbol} mode="report" />

        <section className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-5">
          <h2 className="text-xl font-semibold text-white">{copy.scopeTitle}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">{copy.scopeBody}</p>
        </section>
      </div>
    </AppShell>
  );
}
