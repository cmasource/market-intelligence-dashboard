"use client";

import { ArgentinaMarket } from "@/components/dashboard/ArgentinaMarket";
import { AssetSearch } from "@/components/dashboard/AssetSearch";
import { FeaturedAssets } from "@/components/dashboard/FeaturedAssets";
import { MarketNewsPreview } from "@/components/dashboard/MarketNewsPreview";
import { FixedIncomeComparison } from "@/components/fixed-income/FixedIncomeComparison";
import { AppShell } from "@/components/layout/AppShell";
import { MarketHeatmap } from "@/components/market/MarketHeatmap";
import { MarketRankings } from "@/components/rankings/MarketRankings";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { mockAssets } from "@/lib/mock-data";

export default function Home() {
  const { t, language } = useLanguage();
  const isSpanish = language === "es";
  const featuredAssets = [...mockAssets]
    .sort((a, b) => {
      const aScore = (a.technicalScore ?? 0) + (a.fundamentalScore ?? 0) + Math.abs(a.dailyChange ?? 0);
      const bScore = (b.technicalScore ?? 0) + (b.fundamentalScore ?? 0) + Math.abs(b.dailyChange ?? 0);
      return bScore - aScore;
    })
    .slice(0, 9);

  return (
    <AppShell>
      <div className="space-y-10">
        <section className="grid gap-6 py-4 xl:grid-cols-[1.04fr_0.96fr] xl:items-stretch">
          <div className="cma-panel-elevated flex h-full flex-col justify-between p-5 sm:p-8">
            <div>
              <p className="cma-kicker">{t("heroEyebrow")}</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-[var(--cma-text-primary)] sm:text-5xl lg:text-6xl">
                {t("heroTitle")}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--cma-text-secondary)]">{t("heroSubtitle")}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button href="#markets" variant="primary">
                  {isSpanish ? "Buscar activo" : "Search asset"}
                </Button>
                <Button href="/argentina">{isSpanish ? "Ver Argentina" : "View Argentina"}</Button>
                <Button href="/screener">{isSpanish ? "Abrir screener" : "Open screener"}</Button>
                <Button href="/report/AAPL">{isSpanish ? "Reporte AAPL" : "AAPL report"}</Button>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Card variant="analysis" className="p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--cma-text-muted)]">
                  {isSpanish ? "Datos de mercado" : "Market data"}
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--cma-text-primary)]">
                  {isSpanish ? "Cotizaciones verificadas o no disponibles" : "Verified quotes or unavailable state"}
                </p>
              </Card>
              <Card variant="analysis" className="p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--cma-text-muted)]">
                  {isSpanish ? "Lectura integrada" : "Integrated reading"}
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--cma-text-primary)]">
                  {isSpanish ? "Técnico, fundamentos, cobertura y riesgo" : "Technical, fundamentals, coverage and risk"}
                </p>
              </Card>
              <Card variant="price" className="p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--cma-text-muted)]">
                  {isSpanish ? "Cobertura mixta" : "Mixed coverage"}
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--cma-text-primary)]">
                  {isSpanish ? "Datos reales, proveedor y cobertura pendiente" : "Real, provider and pending coverage"}
                </p>
              </Card>
            </div>
            <p className="mt-4 rounded-md border border-amber-800/40 bg-[var(--cma-bg-panel)] p-3 text-sm leading-6 text-amber-400">
              {t("disclaimer")}
            </p>
          </div>
          <AssetSearch assets={mockAssets} />
        </section>

        <MarketRankings compact />
        <MarketNewsPreview />
        <MarketHeatmap
          compact
          defaultSegment="argentina"
          showControlsInCompact
          maxItems={12}
          title={isSpanish ? "Mapa Merval y segmentos" : "Merval and segment heatmap"}
          description={
            isSpanish
              ? "Arranca en acciones argentinas y permite cambiar a CEDEARs, bonos, USA, ETFs o cripto sin salir del panel."
              : "Starts with Argentine equities and lets you switch to CEDEARs, bonds, USA, ETFs or crypto inside the same panel."
          }
        />
        <FeaturedAssets assets={featuredAssets} />
        <section className="cma-panel cma-card-argentina p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="cma-kicker">{isSpanish ? "Argentina + CEDEAR" : "Argentina + CEDEAR"}</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {isSpanish ? "Cobertura local con trazabilidad de fuente" : "Local coverage with source traceability"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {isSpanish
                  ? "Acciones argentinas, CEDEARs, bonos y especies se separan por carga manual, proveedor, cobertura pendiente y dato no operativo para que la lectura sea clara."
                  : "Argentine equities, CEDEARs, bonds and species are separated by manual load, provider, pending coverage and non-operational data so the reading stays transparent."}
              </p>
            </div>
            <ArgentinaMarket />
          </div>
        </section>
        <FixedIncomeComparison />
      </div>
    </AppShell>
  );
}
