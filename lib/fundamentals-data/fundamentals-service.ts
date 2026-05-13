import { getMockFundamentals } from "./mock-provider";
import { getYahooFundamentals } from "./yahoo-fundamentals-provider";
import {
  getFundamentalsAssetClass,
  getYahooFundamentalsSymbol,
  normalizeFundamentalsSymbol,
} from "./symbol-map";
import type { FundamentalsRequest, FundamentalsResponse } from "./types";
import { buildFundamentalsInterpretation } from "./fundamentals-score";
import { getAlphaVantageFundamentals, getFinnhubFundamentals, getFmpFundamentals } from "@/lib/providers";

function unavailableResponse(
  symbol: string,
  reason: string,
  assetClass = getFundamentalsAssetClass(symbol),
): FundamentalsResponse {
  return {
    symbol,
    provider: "unavailable",
    assetClass,
    sourceLabel: "Not applicable",
    isFallback: false,
    snapshot: {},
    fundamentalScore: null,
    interpretation: {
      ...buildFundamentalsInterpretation({}, null),
      summary: reason,
      bulletPoints: [
        reason,
        "The app keeps the relevant specialized module available for this instrument.",
      ],
    },
    warnings: [reason],
  };
}

function hasProviderData(response: FundamentalsResponse) {
  return Object.values(response.snapshot).some((value) => value !== undefined && value !== null);
}

function isEnabledProviderResponse(response: FundamentalsResponse) {
  return !response.error && hasProviderData(response);
}

export async function getFundamentals(request: FundamentalsRequest): Promise<FundamentalsResponse> {
  const symbol = normalizeFundamentalsSymbol(request.symbol);
  const assetClass = request.assetClass ?? getFundamentalsAssetClass(symbol);
  const normalizedRequest = { ...request, symbol, assetClass };

  try {
    if (assetClass === "crypto") {
      return unavailableResponse(symbol, "Equity fundamentals do not directly apply to crypto assets.", assetClass);
    }

    if (assetClass === "bond") {
      return unavailableResponse(symbol, "Bond analytics are handled through fixed income metrics, not equity fundamentals.", assetClass);
    }

    if (getYahooFundamentalsSymbol(symbol)) {
      const providerAttempts = [
        () => getFmpFundamentals(normalizedRequest),
        () => getFinnhubFundamentals(normalizedRequest),
        () => getAlphaVantageFundamentals(normalizedRequest),
      ];

      for (const attempt of providerAttempts) {
        const response = await attempt();
        if (isEnabledProviderResponse(response)) return response;
      }

      const providerResponse = await getYahooFundamentals(normalizedRequest);

      if (providerResponse.error || !hasProviderData(providerResponse)) {
        return getMockFundamentals(
          normalizedRequest,
          providerResponse.error ?? "Provider fundamentals were insufficient; using fallback mock fundamentals.",
        );
      }

      return providerResponse;
    }

    return getMockFundamentals(normalizedRequest);
  } catch (error) {
    return getMockFundamentals(
      normalizedRequest,
      error instanceof Error ? error.message : "Unexpected fundamentals service error.",
    );
  }
}
