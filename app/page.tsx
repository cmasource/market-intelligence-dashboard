"use client";

import { AssetSearch } from "@/components/dashboard/AssetSearch";
import { FeaturedAssets } from "@/components/dashboard/FeaturedAssets";
import { ArgentinaMacroMonitor } from "@/components/dashboard/ArgentinaMacroMonitor";
import { MarketNewsPreview } from "@/components/dashboard/MarketNewsPreview";
import { MarketPulseVisual } from "@/components/dashboard/MarketPulseVisual";
import { AppShell } from "@/components/layout/AppShell";
import { MarketHeatmap } from "@/components/market/MarketHeatmap";
import { MarketRankings } from "@/components/rankings/MarketRankings";
import { Button } from "@/components/ui/Button";
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
              </div>
            </div>
            <MarketPulseVisual />
            <p className="mt-4 rounded-md border border-amber-800/40 bg-[var(--cma-bg-panel)] p-3 text-sm leading-6 text-amber-400">
              {t("disclaimer")}
            </p>
          </div>
          <AssetSearch assets={mockAssets} />
        </section>

        <MarketRankings compact />
        <MarketNewsPreview />
        <ArgentinaMacroMonitor />
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
      </div>
    </AppShell>
  );
}
