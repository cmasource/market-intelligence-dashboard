"use client";

import { AIMarketBrief } from "@/components/dashboard/AIMarketBrief";
import { ArgentinaMarket } from "@/components/dashboard/ArgentinaMarket";
import { AssetSearch } from "@/components/dashboard/AssetSearch";
import { CryptoMonitor } from "@/components/dashboard/CryptoMonitor";
import { FeaturedAssets } from "@/components/dashboard/FeaturedAssets";
import { FinancialEnginePreview } from "@/components/dashboard/FinancialEnginePreview";
import { MarketOverview } from "@/components/dashboard/MarketOverview";
import { ReportsPlaceholder } from "@/components/dashboard/ReportsPlaceholder";
import { TechnicalOpportunities } from "@/components/dashboard/TechnicalOpportunities";
import { FixedIncomeComparison } from "@/components/fixed-income/FixedIncomeComparison";
import { AppShell } from "@/components/layout/AppShell";
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
      <div className="space-y-8">
        <section className="grid gap-6 py-3 lg:grid-cols-[1.02fr_0.98fr] lg:items-stretch">
          <div
            className={`flex h-full flex-col justify-between rounded-lg border p-5 shadow-2xl backdrop-blur sm:p-7 ${
              isLight
                ? "border-cyan-800/15 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(238,247,252,0.96)_42%,rgba(240,245,255,0.94)_100%)] shadow-slate-900/10"
                : "border-cyan-300/20 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-violet-950/50 shadow-cyan-950/20"
            }`}
          >
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${isLight ? "text-cyan-800" : "text-cyan-200"}`}>
                {t("heroEyebrow")}
              </p>
              <h1 className={`mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl ${isLight ? "text-slate-950" : "text-white"}`}>
                {t("heroTitle")}
              </h1>
              <p className={`mt-4 max-w-3xl text-base leading-7 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                {t("heroSubtitle")}
              </p>
              <p className={`mt-4 text-sm font-medium ${isLight ? "text-cyan-900" : "text-cyan-100"}`}>{t("heroBrandingPhrase")}</p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className={`rounded-lg border p-4 ${isLight ? "border-slate-300 bg-white/80 shadow-sm" : "border-white/10 bg-white/[0.045]"}`}>
                <p className={`text-xs uppercase tracking-[0.16em] ${isLight ? "text-slate-600" : "text-slate-500"}`}>{t("createdBy")}</p>
                <p className={`mt-2 font-semibold ${isLight ? "text-slate-950" : "text-white"}`}>{t("companyName")}</p>
              </div>
              <div className={`rounded-lg border p-4 ${isLight ? "border-slate-300 bg-white/80 shadow-sm" : "border-white/10 bg-white/[0.045]"}`}>
                <p className={`text-xs uppercase tracking-[0.16em] ${isLight ? "text-slate-600" : "text-slate-500"}`}>{t("developedBy")}</p>
                <p className={`mt-2 font-semibold ${isLight ? "text-slate-950" : "text-white"}`}>{t("technologyDivision")}</p>
              </div>
              <div className={`rounded-lg border p-4 ${isLight ? "border-cyan-700/25 bg-cyan-50/80 shadow-sm" : "border-white/10 bg-white/[0.045]"}`}>
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
        <FeaturedAssets assets={mockAssets} />
        <TechnicalOpportunities assets={mockAssets} />
        <ArgentinaMarket />
        <FixedIncomeComparison />
        <CryptoMonitor />
        <FinancialEnginePreview />
        <ReportsPlaceholder />
        <AIMarketBrief />
      </div>
    </AppShell>
  );
}
