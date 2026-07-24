import { findAsset } from "@/lib/mock-data";
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
): Promise<AssetAnalysisBundle> {
  const normalized = symbol.trim().toUpperCase();
  const asset = findAsset(normalized);
  const instrumentResolution = resolveInstrument({ symbol: normalized });
  const technicalSymbol = instrumentResolution?.technicalLayer?.symbol ?? normalized;
  const [technical, fundamentals] = await Promise.all([
    getTechnicalAnalysis(technicalSymbol, "1Y", language),
    getFundamentals({ symbol: normalized }),
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
