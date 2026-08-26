import argentinaManualFundamentals from "@/data/fundamentals-arg.manual.json";
import { getYahooFundamentals } from "./yahoo-fundamentals-provider";
import {
  getFundamentalsAssetClass,
  getYahooFundamentalsSymbol,
  normalizeFundamentalsSymbol,
} from "./symbol-map";
import { getFundamentalProviderSymbol } from "@/lib/instruments";
import type { FundamentalsProviderName, FundamentalsProviderTraceEntry, FundamentalsRequest, FundamentalsResponse, FundamentalsSnapshot } from "./types";
import { buildFundamentalsInterpretation, calculateFundamentalScore } from "./fundamentals-score";
import { getAlphaVantageFundamentals, getFinnhubFundamentals, getFmpFundamentals } from "@/lib/providers";
import {
  isArgentineAdrSymbol,
  sanitizeFundamentalsResponse,
  sanitizeMergedAdrSnapshot,
} from "./provider-quality";

type ManualArgentinaFundamentals = {
  asOf: string | null;
  pe: number | null;
  forwardPe: number | null;
  revenueGrowthYoy: number | null;
  epsGrowthYoy: number | null;
  roe: number | null;
};

const manualArgentinaFundamentals = argentinaManualFundamentals as Record<string, ManualArgentinaFundamentals>;

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

function percentToRatio(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value / 100 : undefined;
}

function getManualArgentinaFundamentals(symbol: string, assetClass: ReturnType<typeof getFundamentalsAssetClass>): FundamentalsResponse | null {
  const normalizedSymbol = normalizeFundamentalsSymbol(symbol);
  const manual = manualArgentinaFundamentals[normalizedSymbol];
  if (!manual) return null;

  const snapshot: FundamentalsSnapshot = {
    trailingPE: manual.pe ?? undefined,
    forwardPE: manual.forwardPe ?? undefined,
    revenueGrowth: percentToRatio(manual.revenueGrowthYoy),
    earningsGrowth: percentToRatio(manual.epsGrowthYoy),
    roe: percentToRatio(manual.roe),
    fiscalYear: manual.asOf ?? undefined,
    period: manual.asOf ?? undefined,
    currency: "ARS",
  };

  if (!hasProviderData({ snapshot } as FundamentalsResponse)) return null;

  const fundamentalScore = calculateFundamentalScore(snapshot);
  const missing = missingFields(snapshot);

  return {
    symbol: normalizedSymbol,
    provider: "manual",
    assetClass,
    sourceLabel: "Manual Argentina fundamentals",
    isFallback: false,
    fetchedAt: new Date().toISOString(),
    snapshot,
    fundamentalScore,
    interpretation: buildFundamentalsInterpretation(snapshot, fundamentalScore),
    missingFields: missing,
    coverageRatio: coverageRatio(snapshot),
    warnings: [
      "Manual Argentina fundamentals are an audited dataset, not a live provider feed.",
      ...(missing.length ? ["Some indicators are not available in the manual dataset."] : []),
    ],
  };
}

export async function getFundamentals(request: FundamentalsRequest): Promise<FundamentalsResponse> {
  const requestedSymbol = normalizeFundamentalsSymbol(request.symbol);
  const providerMapping = getFundamentalProviderSymbol(requestedSymbol);
  const symbol = providerMapping.provider !== "unavailable" ? providerMapping.providerSymbol : requestedSymbol;
  const requestedAssetClass = getFundamentalsAssetClass(requestedSymbol);
  const assetClass = request.assetClass ?? (requestedAssetClass === "argentine_equity" && providerMapping.provider !== "unavailable" ? "stock" : getFundamentalsAssetClass(symbol));
  const normalizedRequest = { ...request, symbol, assetClass };

  try {
    if (assetClass === "crypto") {
      return unavailableResponse(symbol, "Equity fundamentals do not directly apply to crypto assets.", assetClass);
    }

    if (assetClass === "bond") {
      return unavailableResponse(symbol, "Bond analytics are handled through fixed income metrics, not equity fundamentals.", assetClass);
    }

    if (getYahooFundamentalsSymbol(symbol)) {
      const isArgentineAdr = isArgentineAdrSymbol(symbol);
      const providerAttempts = isArgentineAdr
        ? [
            () => getFmpFundamentals(normalizedRequest),
            () => getYahooFundamentals(normalizedRequest),
            () => getAlphaVantageFundamentals(normalizedRequest),
            () => getFinnhubFundamentals(normalizedRequest),
          ]
        : [
            () => getFmpFundamentals(normalizedRequest),
            () => getFinnhubFundamentals(normalizedRequest),
            () => getAlphaVantageFundamentals(normalizedRequest),
          ];
      const providerResponses: FundamentalsResponse[] = [];

      for (const attempt of providerAttempts) {
        const response = sanitizeFundamentalsResponse(await attempt(), { providerSymbol: symbol });
        providerResponses.push(response);
        if (!isArgentineAdr && isEnabledProviderResponse(response) && metricCount(response.snapshot) >= 8) {
          return {
            ...response,
            missingFields: missingFields(response.snapshot),
            coverageRatio: coverageRatio(response.snapshot),
            providerTrace: providerResponses.map(trace),
          };
        }
      }

      const providerResponse = isArgentineAdr
        ? providerResponses.find((response) => response.provider === "yahoo") ?? providerResponses.at(-1)!
        : sanitizeFundamentalsResponse(await getYahooFundamentals(normalizedRequest), { providerSymbol: symbol });
      if (!isArgentineAdr) providerResponses.push(providerResponse);
      const usableResponses = providerResponses.filter(hasProviderData);
      const manualResponse = getManualArgentinaFundamentals(requestedSymbol, requestedAssetClass);

      if (usableResponses.length > 0) {
        const merged = sanitizeMergedAdrSnapshot(mergeSnapshots(usableResponses), { providerSymbol: symbol });
        const snapshot = merged.snapshot;
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
          warnings: Array.from(new Set([
            ...providerResponses.flatMap((response) => response.warnings ?? []),
            ...providerResponses.flatMap((response) => response.error ? [response.error] : []),
            ...merged.warnings,
            ...(missing.length ? ["Some indicators are not available from the current provider coverage."] : []),
          ])),
        };
      }

      if (manualResponse) {
        return {
          ...manualResponse,
          providerTrace: providerResponses.map(trace),
        };
      }

      return unavailableResponse(
        requestedSymbol,
        providerResponse.error ?? "Fundamentals are unavailable from the current provider coverage.",
        requestedAssetClass,
      );
    }

    const manualResponse = getManualArgentinaFundamentals(requestedSymbol, requestedAssetClass);
    if (manualResponse) return manualResponse;

    return unavailableResponse(
      requestedSymbol,
      providerMapping.reason === "No verified fundamentals provider symbol configured."
        ? "Fundamentals are unavailable from the current provider for this instrument."
        : providerMapping.reason,
      requestedAssetClass,
    );
  } catch (error) {
    return unavailableResponse(
      requestedSymbol,
      error instanceof Error ? error.message : "Unexpected fundamentals service error.",
      request.assetClass ?? getFundamentalsAssetClass(requestedSymbol),
    );
  }
}
