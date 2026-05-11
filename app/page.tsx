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
import { marketOverviewItems, mockAssets } from "@/lib/mock-data";

export default function Home() {
  const { t, language } = useLanguage();
  const isSpanish = language === "es";

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="grid gap-6 py-3 lg:grid-cols-[1.02fr_0.98fr] lg:items-stretch">
          <div className="flex h-full flex-col justify-between rounded-lg border border-cyan-300/20 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-violet-950/50 p-5 shadow-2xl shadow-cyan-950/20 backdrop-blur sm:p-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                {t("heroEyebrow")}
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                {t("heroTitle")}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                {t("heroSubtitle")}
              </p>
              <p className="mt-4 text-sm font-medium text-cyan-100">{t("heroBrandingPhrase")}</p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{t("createdBy")}</p>
                <p className="mt-2 font-semibold text-white">{t("companyName")}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{t("developedBy")}</p>
                <p className="mt-2 font-semibold text-white">{t("technologyDivision")}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  {isSpanish ? "Cobertura mixta" : "Mixed coverage"}
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {isSpanish ? "Datos reales, proveedor, simulados y futuros" : "Real, provider, mock and future data"}
                </p>
              </div>
            </div>
            <p className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">
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
