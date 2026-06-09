"use client";

import Link from "next/link";
import { AIMarketBrief } from "@/components/dashboard/AIMarketBrief";
import { ArgentinaMarket } from "@/components/dashboard/ArgentinaMarket";
import { AssetSearch } from "@/components/dashboard/AssetSearch";
import { CryptoMonitor } from "@/components/dashboard/CryptoMonitor";
import { FeaturedAssets } from "@/components/dashboard/FeaturedAssets";
import { FinancialEnginePreview } from "@/components/dashboard/FinancialEnginePreview";
import { MarketOverview } from "@/components/dashboard/MarketOverview";
import { ReportsPlaceholder } from "@/components/dashboard/ReportsPlaceholder";
import { FixedIncomeComparison } from "@/components/fixed-income/FixedIncomeComparison";
import { AppShell } from "@/components/layout/AppShell";
import { MarketHeatmap } from "@/components/market/MarketHeatmap";
import { MarketRankings } from "@/components/rankings/MarketRankings";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { useTheme } from "@/lib/theme/useTheme";
import { marketOverviewItems, mockAssets } from "@/lib/mock-data";

export default function Home() {
  const { t, language } = useLanguage();
  const { resolvedMode } = useTheme();
  const isSpanish = language === "es";
  const isLight = resolvedMode === "light";

  return (
    <AppShell>
      <div className="space-y-10">
        <section className="grid gap-6 py-4 xl:grid-cols-[1.04fr_0.96fr] xl:items-stretch">
          <div
            className={`cma-panel-elevated cma-hero-panel cma-glow-cyan relative flex h-full flex-col justify-between p-5 sm:p-8 ${
              isLight
                ? "border-slate-300 bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_54%,#eef6fb_100%)]"
                : "border-cyan-300/20 bg-[linear-gradient(135deg,rgba(2,6,23,0.98)_0%,rgba(15,23,42,0.94)_46%,rgba(30,27,75,0.72)_100%)]"
            }`}
          >
            <div
              className={`absolute inset-x-0 top-0 h-1 ${
                isLight
                  ? "bg-gradient-to-r from-cyan-700 via-indigo-500 to-emerald-600"
                  : "bg-gradient-to-r from-cyan-300 via-indigo-300 to-emerald-300"
              }`}
            />
            <div className="relative">
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${isLight ? "text-cyan-800" : "text-cyan-200"}`}>
                {t("heroEyebrow")}
              </p>
              <h1 className={`mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl ${isLight ? "text-slate-950" : "text-white"}`}>
                {t("heroTitle")}
              </h1>
              <p className={`mt-4 max-w-3xl text-base leading-7 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                {t("heroSubtitle")}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#markets" className="rounded-full border border-cyan-300/40 bg-cyan-300/14 px-4 py-2 text-sm font-semibold text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.12)] transition hover:bg-cyan-300/20">
                  {isSpanish ? "Buscar activo" : "Search asset"}
                </a>
                <Link href="/argentina" className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-300/40 hover:text-white">
                  {isSpanish ? "Ver Argentina" : "View Argentina"}
                </Link>
                <Link href="/screener" className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-300/40 hover:text-white">
                  {isSpanish ? "Abrir screener" : "Open screener"}
                </Link>
                <Link href="/report/AAPL" className="rounded-full border border-violet-300/30 bg-violet-300/10 px-4 py-2 text-sm font-medium text-violet-100 transition hover:bg-violet-300/15">
                  {isSpanish ? "Reporte AAPL" : "AAPL report"}
                </Link>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className={`cma-card-analysis p-4 ${isLight ? "bg-white" : ""}`}>
                <p className={`text-xs uppercase tracking-[0.16em] ${isLight ? "text-slate-600" : "text-slate-500"}`}>
                  {isSpanish ? "Datos de mercado" : "Market data"}
                </p>
                <p className={`mt-2 text-sm font-semibold ${isLight ? "text-slate-950" : "text-white"}`}>
                  {isSpanish ? "Proveedor real con respaldo compatible" : "Real provider data with compatible fallback"}
                </p>
              </div>
              <div className={`cma-card-analysis p-4 ${isLight ? "bg-white" : ""}`}>
                <p className={`text-xs uppercase tracking-[0.16em] ${isLight ? "text-slate-600" : "text-slate-500"}`}>
                  {isSpanish ? "Lectura integrada" : "Integrated reading"}
                </p>
                <p className={`mt-2 text-sm font-semibold ${isLight ? "text-slate-950" : "text-white"}`}>
                  {isSpanish ? "Técnico, fundamentos, cobertura y riesgo" : "Technical, fundamentals, coverage and risk"}
                </p>
              </div>
              <div className={`cma-card-price p-4 ${isLight ? "bg-cyan-50" : ""}`}>
                <p className={`text-xs uppercase tracking-[0.16em] ${isLight ? "text-cyan-900" : "text-slate-500"}`}>
                  {isSpanish ? "Cobertura mixta" : "Mixed coverage"}
                </p>
                <p className={`mt-2 text-sm font-semibold ${isLight ? "text-slate-950" : "text-white"}`}>
                  {isSpanish ? "Datos reales, proveedor, simulados y futuros" : "Real, provider, mock and future data"}
                </p>
              </div>
            </div>
            <p
              className={`mt-4 rounded-lg border p-3 text-sm leading-6 ${
                isLight ? "border-amber-700/25 bg-amber-50 text-amber-950" : "border-amber-300/20 bg-amber-300/10 text-amber-100"
              }`}
            >
              {t("disclaimer")}
            </p>
          </div>
          <AssetSearch assets={mockAssets} />
        </section>

        <MarketOverview items={marketOverviewItems} />
        <MarketRankings />
        <MarketHeatmap compact />
        <FeaturedAssets assets={mockAssets} />
        <section className="cma-panel cma-card-argentina p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="cma-kicker">{isSpanish ? "Argentina + CEDEAR" : "Argentina + CEDEAR"}</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {isSpanish ? "Cobertura local con trazabilidad de fuente" : "Local coverage with source traceability"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {isSpanish
                  ? "Acciones argentinas, CEDEARs, bonos y especies se separan por carga manual, dato simulado, proveedor y cobertura futura para que la demo sea clara."
                  : "Argentine equities, CEDEARs, bonds and species are separated by manual load, mock data, provider and future coverage so the demo stays transparent."}
              </p>
            </div>
            <ArgentinaMarket />
          </div>
        </section>
        <FixedIncomeComparison />
        <CryptoMonitor />
        <FinancialEnginePreview />
        <ReportsPlaceholder />
        <AIMarketBrief />
      </div>
    </AppShell>
  );
}
