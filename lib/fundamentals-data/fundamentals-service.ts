import { getMockFundamentals } from "./mock-provider";
import { getYahooFundamentals } from "./yahoo-fundamentals-provider";
import {
  getFundamentalsAssetClass,
  getYahooFundamentalsSymbol,
  normalizeFundamentalsSymbol,
} from "./symbol-map";
import type { FundamentalsProviderName, FundamentalsProviderTraceEntry, FundamentalsRequest, FundamentalsResponse, FundamentalsSnapshot } from "./types";
import { buildFundamentalsInterpretation, calculateFundamentalScore } from "./fundamentals-score";
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
    missingFields: publicCoverageFields,
    coverageRatio: 0,
  };
}

const metricFields: Array<keyof FundamentalsSnapshot> = [
  "marketPrice",
  "marketCap",
  "enterpriseValue",
  "trailingPE",
  "forwardPE",
  "priceToBook",
  "priceToSales",
  "pegRatio",
  "eps",
  "bookValuePerShare",
  "roe",
  "roa",
  "grossMargin",
  "operatingMargin",
  "ebitdaMargin",
  "netMargin",
  "revenueGrowth",
  "earningsGrowth",
  "debtToEquity",
  "currentRatio",
  "quickRatio",
  "dividendYield",
  "beta",
  "fiftyTwoWeekHigh",
  "fiftyTwoWeekLow",
];

const publicCoverageFields: Array<keyof FundamentalsSnapshot> = [
  "marketCap",
  "trailingPE",
  "forwardPE",
  "priceToBook",
  "priceToSales",
  "pegRatio",
  "eps",
  "bookValuePerShare",
  "roe",
  "roa",
  "grossMargin",
  "operatingMargin",
  "ebitdaMargin",
  "netMargin",
  "revenueGrowth",
  "earningsGrowth",
  "debtToEquity",
  "currentRatio",
  "quickRatio",
  "dividendYield",
  "beta",
  "fiftyTwoWeekHigh",
  "fiftyTwoWeekLow",
];

function hasProviderData(response: FundamentalsResponse) {
  return metricFields.some((field) => response.snapshot[field] !== undefined && response.snapshot[field] !== null);
}

function metricCount(snapshot: FundamentalsSnapshot) {
  return metricFields.filter((field) => snapshot[field] !== undefined && snapshot[field] !== null).length;
}

function missingFields(snapshot: FundamentalsSnapshot) {
  return publicCoverageFields.filter((field) => snapshot[field] === undefined || snapshot[field] === null);
}

function coverageRatio(snapshot: FundamentalsSnapshot) {
  const available = publicCoverageFields.length - missingFields(snapshot).length;
  return Number((available / publicCoverageFields.length).toFixed(2));
}

function isEnabledProviderResponse(response: FundamentalsResponse) {
  return !response.error && hasProviderData(response);
}

function trace(response: FundamentalsResponse): FundamentalsProviderTraceEntry {
  return {
    provider: response.provider,
    attempted: true,
    success: hasProviderData(response) && !response.error,
    sourceLabel: response.sourceLabel,
    ...(response.error ? { error: response.error } : {}),
  };
}

function mergeSnapshots(responses: FundamentalsResponse[]): FundamentalsSnapshot {
  return responses.reduce<FundamentalsSnapshot>((snapshot, response) => {
    for (const [key, value] of Object.entries(response.snapshot) as Array<[keyof FundamentalsSnapshot, FundamentalsSnapshot[keyof FundamentalsSnapshot]]>) {
      if (snapshot[key] === undefined || snapshot[key] === null) {
        snapshot[key] = value as never;
      }
    }
    return snapshot;
  }, {});
}

function combinedProvider(responses: FundamentalsResponse[]): FundamentalsProviderName {
  return responses.find((response) => response.provider !== "unavailable")?.provider ?? "unavailable";
}

function combinedSourceLabel(responses: FundamentalsResponse[]) {
  const labels = Array.from(new Set(responses.map((response) => response.sourceLabel).filter(Boolean)));
  return labels.length > 1 ? "Provider fundamentals (partial coverage)" : labels[0] ?? "Provider fundamentals";
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
      const providerResponses: FundamentalsResponse[] = [];

      for (const attempt of providerAttempts) {
        const response = await attempt();
        providerResponses.push(response);
        if (isEnabledProviderResponse(response) && metricCount(response.snapshot) >= 8) {
          return {
            ...response,
            missingFields: missingFields(response.snapshot),
            coverageRatio: coverageRatio(response.snapshot),
            providerTrace: providerResponses.map(trace),
          };
        }
      }

      const providerResponse = await getYahooFundamentals(normalizedRequest);
      providerResponses.push(providerResponse);
      const usableResponses = providerResponses.filter(hasProviderData);

      if (usableResponses.length > 0) {
        const snapshot = mergeSnapshots(usableResponses);
        const fundamentalScore = calculateFundamentalScore(snapshot);
        const missing = missingFields(snapshot);
        const sourceLabel = combinedSourceLabel(usableResponses);
        return {
          symbol,
          provider: combinedProvider(usableResponses),
          assetClass,
          sourceLabel,
          isFallback: false,
          fetchedAt: new Date().toISOString(),
          snapshot,
          fundamentalScore,
          interpretation: buildFundamentalsInterpretation(snapshot, fundamentalScore),
          missingFields: missing,
          coverageRatio: coverageRatio(snapshot),
          providerTrace: providerResponses.map(trace),
          warnings: [
            ...providerResponses.flatMap((response) => response.warnings ?? []),
            ...providerResponses.flatMap((response) => response.error ? [response.error] : []),
            ...(missing.length ? ["Some indicators are not available from the current provider coverage."] : []),
          ],
        };
      }

      const fallback = getMockFundamentals(
          normalizedRequest,
          providerResponse.error ?? "Provider fundamentals were insufficient; using fallback mock fundamentals.",
        );
      return {
        ...fallback,
        missingFields: missingFields(fallback.snapshot),
        coverageRatio: coverageRatio(fallback.snapshot),
        providerTrace: providerResponses.map(trace),
      };
    }

    const fallback = getMockFundamentals(normalizedRequest);
    return { ...fallback, missingFields: missingFields(fallback.snapshot), coverageRatio: coverageRatio(fallback.snapshot) };
  } catch (error) {
    const fallback = getMockFundamentals(
      normalizedRequest,
      error instanceof Error ? error.message : "Unexpected fundamentals service error.",
    );
    return { ...fallback, missingFields: missingFields(fallback.snapshot), coverageRatio: coverageRatio(fallback.snapshot) };
  }
}
