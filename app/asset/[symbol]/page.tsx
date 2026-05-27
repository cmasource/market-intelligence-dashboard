import { AssetDisclaimer } from "@/components/asset/AssetDisclaimer";
import { AISummaryCard } from "@/components/asset/AISummaryCard";
import { AssetHeader } from "@/components/asset/AssetHeader";
import { AssetNotFound } from "@/components/asset/AssetNotFound";
import { BondMetricsCard } from "@/components/asset/BondMetricsCard";
import { FundamentalAnalysisCard } from "@/components/asset/FundamentalAnalysisCard";
import { NewsPanel } from "@/components/asset/NewsPanel";
import { RelatedInstrumentsCard } from "@/components/asset/RelatedInstrumentsCard";
import { TechnicalAnalysisCard } from "@/components/asset/TechnicalAnalysisCard";
import { MarketSignalGauge } from "@/components/analysis/MarketSignalGauge";
import { CedearAnalyticsCard } from "@/components/cedears/CedearAnalyticsCard";
import { InteractiveAssetChart } from "@/components/charts/InteractiveAssetChart";
import { DataCoveragePanel } from "@/components/data-coverage/DataCoveragePanel";
import { DataTransparencyNote } from "@/components/data-coverage/DataTransparencyNote";
import { AssetIntelligenceReport } from "@/components/intelligence/AssetIntelligenceReport";
import { AppShell } from "@/components/layout/AppShell";
import Link from "next/link";
import { getInstrumentBySymbol } from "@/lib/instrument-universe";
import { isCedearSymbol } from "@/lib/cedears";
import { findAsset, mockAssets } from "@/lib/mock-data";

function formatCategory(category: string) {
  return category.replaceAll("_", " ");
}

export function generateStaticParams() {
  return mockAssets.map((asset) => ({
    symbol: asset.symbol,
  }));
}

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const asset = findAsset(decodeURIComponent(symbol));
  const instrument = getInstrumentBySymbol(decodeURIComponent(symbol));

  if (!asset) {
    if (instrument) {
      return (
        <AppShell width="asset">
          <div className="space-y-7">
            <section className="cma-panel-elevated p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
                Future coverage
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">{instrument.symbol}</h1>
              <p className="mt-2 text-lg text-slate-300">{instrument.displayName}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Category</p>
                  <p className="mt-2 font-semibold capitalize text-white">{formatCategory(instrument.category)}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Market</p>
                  <p className="mt-2 font-semibold text-white">{instrument.market}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Currency</p>
                  <p className="mt-2 font-semibold text-white">{instrument.currency}</p>
                </div>
              </div>
            </section>
            <DataCoveragePanel symbol={instrument.symbol} />
            <AssetIntelligenceReport symbol={instrument.symbol} />
            <RelatedInstrumentsCard symbol={instrument.symbol} />
            <section className="rounded-lg border border-white/10 bg-slate-950/55 p-5">
              <h2 className="text-xl font-semibold text-white">Preliminary profile</h2>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
                This instrument is part of the planned CMA Market Intelligence universe, but it does not yet have full price,
                technical, fundamentals or news coverage.
              </p>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">
                Este instrumento forma parte del universo previsto de CMA Market Intelligence, pero todavia no cuenta con
                cobertura completa de precio, analisis tecnico, fundamentos o noticias.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/markets" className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/15">
                  Back to Markets / Volver a Mercados
                </Link>
                <Link href="/screener" className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-white">
                  Open Screener / Abrir Screener
                </Link>
              </div>
            </section>
          </div>
        </AppShell>
      );
    }

    return (
      <AppShell>
        <AssetNotFound symbol={decodeURIComponent(symbol)} />
      </AppShell>
    );
  }

  return (
    <AppShell width="asset">
      <div className="space-y-7">
        <AssetHeader asset={asset} />
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <DataCoveragePanel symbol={asset.symbol} />
          <DataTransparencyNote />
        </div>
        <AssetIntelligenceReport symbol={asset.symbol} />
        <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
          <MarketSignalGauge
            technicalScore={asset.technicalScore}
            fundamentalScore={asset.fundamentalScore}
            assetType={asset.type}
            riskLevel={asset.riskLevel}
          />
          <InteractiveAssetChart symbol={asset.symbol} name={asset.name} currency={asset.currency} />
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <TechnicalAnalysisCard asset={asset} />
          <FundamentalAnalysisCard
            asset={asset}
            symbol={asset.symbol}
            assetType={asset.type}
            fallbackFundamentals={asset.fundamentals}
            fallbackFundamentalScore={asset.fundamentalScore}
            currency={asset.currency}
          />
        </div>
        {isCedearSymbol(asset.symbol) ? <CedearAnalyticsCard symbol={asset.symbol} /> : null}
        {asset.bondMetrics ? <BondMetricsCard symbol={asset.symbol} fallbackBondMetrics={asset.bondMetrics} /> : null}
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <NewsPanel news={asset.news} symbol={asset.symbol} />
          <AISummaryCard asset={asset} />
        </div>
        <RelatedInstrumentsCard symbol={asset.symbol} />
        <AssetDisclaimer />
      </div>
    </AppShell>
  );
}
