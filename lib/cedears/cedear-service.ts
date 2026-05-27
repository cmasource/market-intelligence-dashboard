import { getMarketData } from "@/lib/market-data";
import { calculateCclSpread, calculateImpliedCcl } from "./ccl";
import { getMockCedear, MOCK_REFERENCE_CCL, mockCedears } from "./mock-cedears";
import type { CedearAnalytics, CedearInstrument, CedearInterpretation, CedearStatus } from "./types";

function latestClose(candles: Awaited<ReturnType<typeof getMarketData>>["candles"]) {
  const last = candles.at(-1);
  return typeof last?.close === "number" && Number.isFinite(last.close) && last.close > 0 ? last.close : null;
}

async function getUnderlyingPrice(instrument: CedearInstrument) {
  try {
    const response = await Promise.race([
      getMarketData({ symbol: instrument.underlyingSymbol, timeframe: "1D" }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("CEDEAR underlying provider timeout.")), 4_000);
      }),
    ]);
    return {
      price: latestClose(response.candles) ?? instrument.underlyingPrice ?? null,
      usedProvider: !response.isFallback && response.provider !== "mock",
      sourceLabel: response.isFallback
        ? `Underlying fallback: ${response.sourceLabel}`
        : `Underlying provider: ${response.sourceLabel}`,
    };
  } catch {
    return {
      price: instrument.underlyingPrice ?? null,
      usedProvider: false,
      sourceLabel: "Underlying fallback: mock CEDEAR data",
    };
  }
}

function buildInterpretation(params: {
  impliedCcl: number | null;
  cclSpread: number | null;
  usedProvider: boolean;
}): CedearInterpretation {
  const { impliedCcl, cclSpread, usedProvider } = params;

  if (impliedCcl === null) {
    return {
      label: "Incomplete CEDEAR calculation",
      tone: "warning",
      summary: "The implied CCL cannot be calculated with the currently available inputs.",
      bulletPoints: [
        "Local CEDEAR price and ratio remain simulated structured values.",
        "Underlying price may come from provider data or fallback data.",
        "This module is informational and not a trading signal.",
      ],
    };
  }

  const spreadText = typeof cclSpread === "number" ? `${(cclSpread * 100).toFixed(2)}%` : "not available";

  return {
    label: usedProvider ? "Provider underlying with simulated local CEDEAR" : "Simulated CEDEAR calculation",
    tone: "neutral",
    summary: `The implied CCL is calculated from local CEDEAR price, ratio and underlying USD price. Spread versus reference CCL is ${spreadText}.`,
    bulletPoints: [
      "Local CEDEAR price is simulated until BYMA/IOL integration is enabled.",
      "Ratio is structured simulated data until official source integration is enabled.",
      usedProvider ? "Underlying price used provider data when available." : "Underlying price used fallback or mock data.",
    ],
  };
}

export async function getCedearAnalytics(symbol: string): Promise<CedearAnalytics | null> {
  const instrument = getMockCedear(symbol);
  if (!instrument) return null;

  const underlying = await getUnderlyingPrice(instrument);
  const impliedCcl = underlying.price === null ? null : calculateImpliedCcl(instrument.localPrice, underlying.price, instrument.ratio);
  const cclSpread = calculateCclSpread(impliedCcl, MOCK_REFERENCE_CCL);
  const status: CedearStatus = underlying.usedProvider ? "provider_underlying" : instrument.status;

  return {
    localSymbol: instrument.localSymbol,
    underlyingSymbol: instrument.underlyingSymbol,
    underlyingName: instrument.underlyingName,
    ratio: instrument.ratio,
    localPrice: instrument.localPrice,
    underlyingPrice: underlying.price,
    impliedCcl,
    referenceCcl: MOCK_REFERENCE_CCL,
    cclSpread,
    sourceLabel: `${instrument.sourceLabel}; ${underlying.sourceLabel}; CCL calculated from available data`,
    isMock: true,
    status,
    interpretation: buildInterpretation({ impliedCcl, cclSpread, usedProvider: underlying.usedProvider }),
    warnings: [
      "Local CEDEAR price is simulated until BYMA/IOL integration is enabled.",
      "CEDEAR ratio is structured/simulated until official source integration is enabled.",
      "Implied CCL is informational and depends on price/ratio convention.",
      "Technical and fundamental analysis is based on the underlying asset when local CEDEAR integration is not available.",
    ],
  };
}

export async function getAllCedearAnalytics(): Promise<CedearAnalytics[]> {
  const analytics = await Promise.all(mockCedears.map((instrument) => getCedearAnalytics(instrument.localSymbol)));
  return analytics.filter((item): item is CedearAnalytics => Boolean(item));
}
