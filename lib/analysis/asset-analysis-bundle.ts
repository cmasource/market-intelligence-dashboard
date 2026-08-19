import { findAsset } from "@/lib/mock-data";
import { assetFromInstrument } from "@/lib/assets/asset-from-instrument";
import { getFundamentals } from "@/lib/fundamentals-data";
import { resolveInstrument } from "@/lib/instruments/resolveInstrument";
import type { FundamentalsResponse } from "@/lib/fundamentals-data/types";
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
  const asset = mockAsset && (!resolvedAsset || (mockAsset.type === resolvedAsset.type && mockAsset.currency === resolvedAsset.currency))
    ? mockAsset
    : resolvedAsset;
  const technicalSymbol = instrumentResolution?.technicalLayer?.symbol ?? normalized;
  const instrument = instrumentResolution?.instrument;
  const fundamentalSymbol = instrument?.underlyingSymbol ?? instrument?.providerSymbol ?? normalized;
  const fundamentalsAssetClass = instrument?.assetClass === "etf" || instrument?.assetClass === "cedear_etf" ? "etf" : "stock";
  const [technical, fundamentals] = await Promise.all([
    getTechnicalAnalysis(technicalSymbol, "1Y", language),
    getFundamentals({ symbol: fundamentalSymbol, assetClass: fundamentalsAssetClass }),
  ]);

  return {
    symbol: normalized,
    timeframe: "1Y",
    generatedAt: new Date().toISOString(),
    technical,
    fundamentals,
    marketSignal: calculateMarketSignalScore({
      technicalScore: technical.isFallback ? null : technical.technicalScore,
      fundamentalScore: fundamentals.fundamentalScore,
      assetType: asset?.type,
      riskLevel: asset?.riskLevel,
      language,
    }),
  };
}
