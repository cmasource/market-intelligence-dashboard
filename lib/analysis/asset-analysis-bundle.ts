import { findAsset } from "@/lib/mock-data";
import { assetFromInstrument } from "@/lib/assets/asset-from-instrument";
import { getFundamentals } from "@/lib/fundamentals-data";
import { resolveInstrument } from "@/lib/instruments/resolveInstrument";
import type { FundamentalsResponse } from "@/lib/fundamentals-data/types";
import { buildIntegratedOutlook, type IntegratedOutlook } from "@/lib/intelligence/integrated-outlook";
import { enhanceIntegratedOutlook } from "@/lib/intelligence/integrated-outlook-ai";
import { calculateMarketSignalScore, type MarketSignalResult } from "./market-signal";
import { getTechnicalAnalysis } from "./technical-analysis-service";
import type { TechnicalAnalysisResponse } from "./types";

export type AssetAnalysisBundle = {
  symbol: string;
  timeframe: "1Y";
  generatedAt: string;
  technical: TechnicalAnalysisResponse;
  fundamentals: FundamentalsResponse;
  marketSignal: MarketSignalResult;
  integratedOutlook: IntegratedOutlook;
};

export async function getAssetAnalysisBundle(
  symbol: string,
  language: "en" | "es" = "en",
  instrumentId?: string,
): Promise<AssetAnalysisBundle> {
  const normalized = symbol.trim().toUpperCase();
  const instrumentResolution = resolveInstrument({ symbol: normalized, instrumentId });
  const resolvedAsset = instrumentResolution ? assetFromInstrument(instrumentResolution.instrument) : null;
  const mockAsset = findAsset(normalized);
  const asset = resolvedAsset ?? mockAsset;
  const technicalSymbol = instrumentResolution?.technicalLayer?.symbol ?? normalized;
  const instrument = instrumentResolution?.instrument;
  const fundamentalSymbol = instrument?.underlyingSymbol ?? instrument?.providerSymbol ?? normalized;
  const fundamentalsAssetClass = instrument?.assetClass === "etf" || instrument?.assetClass === "cedear_etf" ? "etf" : "stock";
  const [technical, providerFundamentals] = await Promise.all([
    getTechnicalAnalysis(technicalSymbol, "1Y", language),
    getFundamentals({ symbol: fundamentalSymbol, assetClass: fundamentalsAssetClass }),
  ]);
  const fundamentals: FundamentalsResponse = {
    ...providerFundamentals,
    listingContext: {
      basis: instrument?.market === "argentina" && Boolean(instrument.underlyingSymbol)
        ? "underlying_adr"
        : "direct",
      requestedSymbol: instrument?.symbol ?? normalized,
      providerSymbol: fundamentalSymbol,
      market: instrument?.underlyingExchange ?? instrument?.exchange,
      currency: instrument?.underlyingCurrency ?? instrument?.currency,
    },
  };
  const marketSignal = calculateMarketSignalScore({
    technicalScore: technical.isFallback ? null : technical.technicalScore,
    fundamentalScore: fundamentals.fundamentalScore,
    assetType: asset?.type,
    riskLevel: asset?.riskLevel,
    language,
  });
  const deterministicOutlook = buildIntegratedOutlook({
    symbol: normalized,
    language,
    technicalScore: technical.isFallback ? null : technical.technicalScore,
    technicalSnapshot: technical.isFallback ? null : technical.snapshot,
    fundamentals,
    marketSignal,
  });
  const integratedOutlook = await enhanceIntegratedOutlook(normalized, language, deterministicOutlook);

  return {
    symbol: normalized,
    timeframe: "1Y",
    generatedAt: new Date().toISOString(),
    technical,
    fundamentals,
    marketSignal,
    integratedOutlook,
  };
}
