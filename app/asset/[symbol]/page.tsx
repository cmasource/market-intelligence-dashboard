import { AssetDisclaimer } from "@/components/asset/AssetDisclaimer";
import { AssetHeader } from "@/components/asset/AssetHeader";
import { AssetAnalysisProvider } from "@/components/asset/AssetAnalysisProvider";
import { AssetQuoteProvider } from "@/components/asset/AssetQuoteProvider";
import { AssetNotFound } from "@/components/asset/AssetNotFound";
import { AssetSecondaryDetails } from "@/components/asset/AssetSecondaryDetails";
import { BondMetricsCard } from "@/components/asset/BondMetricsCard";
import { FundamentalAnalysisCard } from "@/components/asset/FundamentalAnalysisCard";
import { InvestmentDecisionPanel } from "@/components/asset/InvestmentDecisionPanel";
import { NewsPanel } from "@/components/asset/NewsPanel";
import { RelatedInstrumentsCard } from "@/components/asset/RelatedInstrumentsCard";
import { ResearchTearsheetCard } from "@/components/asset/ResearchTearsheetCard";
import { TechnicalAnalysisCard } from "@/components/asset/TechnicalAnalysisCard";
import { CedearAnalyticsCard } from "@/components/cedears/CedearAnalyticsCard";
import { InteractiveAssetChart } from "@/components/charts/InteractiveAssetChart";
import { TradingViewAdvancedChart } from "@/components/charts/TradingViewAdvancedChart";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { assetFromInstrument } from "@/lib/assets/asset-from-instrument";
import { resolveInstrument } from "@/lib/instruments/resolveInstrument";
import { findAsset, mockAssets } from "@/lib/mock-data";
import { getTradingViewSymbol } from "@/lib/tradingview/symbol-map";

export function generateStaticParams() {
  return mockAssets.map((asset) => ({
    symbol: asset.symbol,
  }));
}

export default async function AssetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ instrumentId?: string | string[] }>;
}) {
  const { symbol } = await params;
  const rawInstrumentId = (await searchParams).instrumentId;
  const instrumentId = Array.isArray(rawInstrumentId) ? rawInstrumentId[0] : rawInstrumentId;
  const normalizedSymbol = decodeURIComponent(symbol);
  const instrumentResolution = resolveInstrument({ symbol: normalizedSymbol, instrumentId });
  const resolvedAsset = instrumentResolution ? assetFromInstrument(instrumentResolution.instrument) : null;
  const mockAsset = findAsset(normalizedSymbol);
  const asset = resolvedAsset ?? mockAsset;

  if (!asset) {
    return (
      <AppShell>
        <AssetNotFound symbol={normalizedSymbol} />
      </AppShell>
    );
  }

  const resolvedInstrumentId = instrumentResolution?.instrument.id;
  const tradingViewMapping = getTradingViewSymbol(asset.symbol, resolvedInstrumentId);
  const isFixedIncome = ["sovereign_bond", "cer_bond", "corporate_bond", "letra"].includes(asset.type);

  return (
    <AppShell width="asset">
      <AssetQuoteProvider
        symbol={asset.symbol}
        instrumentId={resolvedInstrumentId}
        isArgentina={Boolean(asset.argentinaContext)}
      >
      <AssetAnalysisProvider symbol={asset.symbol} instrumentId={resolvedInstrumentId} enabled={!isFixedIncome}>
      <div className="space-y-6">
        <AssetHeader asset={asset} />
        <RelatedInstrumentsCard symbol={asset.symbol} instrumentId={resolvedInstrumentId} />
        {!isFixedIncome ? <InvestmentDecisionPanel asset={asset} /> : null}
        {!isFixedIncome ? <ResearchTearsheetCard asset={asset} /> : null}
        {tradingViewMapping.verified ? (
          <TradingViewAdvancedChart symbol={asset.symbol} instrumentId={resolvedInstrumentId} height={620} />
        ) : (
          <section className="cma-panel-elevated p-4 sm:p-5" data-testid="price-action-section">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="cma-kicker">Acción del precio</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Acción del precio</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                  Símbolo TradingView no verificado. Se muestra un gráfico interno de respaldo como referencia secundaria.
                </p>
              </div>
              <Badge tone="warning" className="w-fit">
                {tradingViewMapping.tradingViewSymbol}
              </Badge>
            </div>
            <details className="rounded-lg border border-white/10 bg-slate-950/45 p-4" data-testid="legacy-chart-fallback">
              <summary className="cursor-pointer text-sm font-semibold text-[var(--cma-accent-cyan)]">Gráfico interno de respaldo</summary>
              <div className="mt-4">
                <InteractiveAssetChart symbol={asset.symbol} name={asset.name} currency={asset.currency} />
              </div>
            </details>
          </section>
        )}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.85fr)] xl:items-start">
          <div className="space-y-6">
            {!isFixedIncome ? <TechnicalAnalysisCard asset={asset} /> : <BondMetricsCard />}
            <NewsPanel symbol={asset.symbol} />
          </div>
          <aside className="space-y-6 xl:sticky xl:top-24">
            {!isFixedIncome ? <FundamentalAnalysisCard
              asset={asset}
              symbol={asset.symbol}
              assetType={asset.type}
              fallbackFundamentals={asset.fundamentals}
              fallbackFundamentalScore={asset.fundamentalScore}
              currency={asset.currency}
            /> : null}
            {asset.type === "cedear" ? <CedearAnalyticsCard symbol={asset.symbol} /> : null}
          </aside>
        </div>
        <AssetSecondaryDetails symbol={asset.symbol} />
        <AssetDisclaimer />
      </div>
      </AssetAnalysisProvider>
      </AssetQuoteProvider>
    </AppShell>
  );
}
