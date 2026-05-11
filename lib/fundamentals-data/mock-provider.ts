import { findAsset } from "@/lib/mock-data";
import type { FundamentalsRequest, FundamentalsResponse, FundamentalsSnapshot } from "./types";
import { buildFundamentalsInterpretation, calculateFundamentalScore } from "./fundamentals-score";
import { getFundamentalsAssetClass, normalizeFundamentalsSymbol } from "./symbol-map";

function unavailableResponse(symbol: string, reason: string): FundamentalsResponse {
  return {
    symbol,
    provider: "unavailable",
    assetClass: getFundamentalsAssetClass(symbol),
    sourceLabel: "Not applicable",
    isFallback: true,
    snapshot: {},
    fundamentalScore: null,
    interpretation: {
      label: "Fundamentals not applicable",
      tone: "neutral",
      summary: reason,
      bulletPoints: [
        "Equity-style fundamentals are not available for this instrument in Sprint 7.",
        "Fallback behavior remains active and the app stays usable.",
      ],
    },
    warnings: [reason],
  };
}

export function getMockFundamentals(request: FundamentalsRequest, error?: string): FundamentalsResponse {
  const symbol = normalizeFundamentalsSymbol(request.symbol);
  const asset = findAsset(symbol);

  if (!asset?.fundamentals) {
    return unavailableResponse(symbol, "Equity fundamentals do not directly apply to this instrument in the current MVP model.");
  }

  const snapshot: FundamentalsSnapshot = {
    marketPrice: asset.price,
    trailingPE: asset.fundamentals.peRatio,
    priceToBook: asset.fundamentals.pbRatio,
    eps: asset.fundamentals.eps,
    bookValuePerShare: asset.fundamentals.bookValuePerShare,
    roe: asset.fundamentals.roe / 100,
    roa: asset.fundamentals.roa / 100,
    ebitdaMargin: asset.fundamentals.ebitdaMargin / 100,
    dividendYield: asset.fundamentals.dividendYield / 100,
    currency: asset.currency.includes("/") ? undefined : asset.currency,
    period: "Mock MVP",
  };
  const fundamentalScore = calculateFundamentalScore(snapshot) ?? asset.fundamentalScore ?? null;

  return {
    symbol,
    provider: "mock",
    assetClass: request.assetClass ?? getFundamentalsAssetClass(symbol),
    sourceLabel: "Mock fundamentals",
    isFallback: true,
    snapshot,
    fundamentalScore,
    interpretation: buildFundamentalsInterpretation(snapshot, fundamentalScore),
    ...(error ? { error, warnings: [error] } : {}),
  };
}
