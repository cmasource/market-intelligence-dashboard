"use client";

import { AssetSearch } from "@/components/dashboard/AssetSearch";
import { FeaturedAssets } from "@/components/dashboard/FeaturedAssets";
import { ArgentinaMacroMonitor } from "@/components/dashboard/ArgentinaMacroMonitor";
import { MarketNewsPreview } from "@/components/dashboard/MarketNewsPreview";
import { AppShell } from "@/components/layout/AppShell";
import { MarketHeatmap } from "@/components/market/MarketHeatmap";
import { MarketRankings } from "@/components/rankings/MarketRankings";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { mockAssets } from "@/lib/mock-data";
import { ArrowUpRight, Clock3 } from "lucide-react";
import Link from "next/link";

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
        <section className="pt-1">
          <div className="mb-5 flex flex-col gap-4 border-b border-[var(--cma-border-soft)] pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="cma-kicker">{isSpanish ? "Mercados · en vivo" : "Global markets · live"}</p>
              <h1 className="mt-2 text-3xl font-semibold text-[var(--cma-text-primary)] sm:text-4xl">
                {isSpanish ? "Resumen de mercado" : "Market overview"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--cma-text-secondary)]">
                {isSpanish
                  ? "Señales, precios y contexto para decidir qué analizar a continuación."
                  : "Signals, prices and context to decide what to analyze next."}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--cma-text-muted)]">
              <Clock3 size={14} aria-hidden="true" />
              <span>{isSpanish ? "Mercado en seguimiento" : "Market monitoring"}</span>
            </div>
          </div>
          <AssetSearch assets={mockAssets} />
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <Link href="/argentina" className="inline-flex items-center gap-1.5 font-medium text-[var(--cma-text-secondary)] transition hover:text-[var(--cma-accent-cyan)]">
              {isSpanish ? "Mercado argentino" : "Argentina market"}<ArrowUpRight size={14} />
            </Link>
            <Link href="/markets" className="inline-flex items-center gap-1.5 font-medium text-[var(--cma-text-secondary)] transition hover:text-[var(--cma-accent-cyan)]">
              {isSpanish ? "Todos los mercados" : "All markets"}<ArrowUpRight size={14} />
            </Link>
          </div>
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
