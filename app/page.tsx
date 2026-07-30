"use client";

import { FeaturedAssets } from "@/components/dashboard/FeaturedAssets";
import { ArgentinaMacroMonitor } from "@/components/dashboard/ArgentinaMacroMonitor";
import { DashboardWelcome } from "@/components/dashboard/DashboardWelcome";
import { CaucionSpikeAlert } from "@/components/dashboard/CaucionSpikeAlert";
import { MarketNewsPreview } from "@/components/dashboard/MarketNewsPreview";
import { AppShell } from "@/components/layout/AppShell";
import { MarketHeatmap } from "@/components/market/MarketHeatmap";
import { MarketRankings } from "@/components/rankings/MarketRankings";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { mockAssets } from "@/lib/mock-data";

export default function Home() {
  const { language } = useLanguage();
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
      <div className="space-y-6 lg:space-y-7">
        <DashboardWelcome assets={mockAssets} />
        <CaucionSpikeAlert />

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
