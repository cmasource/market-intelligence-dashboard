import { getArgentinaQuote } from "@/lib/argentina";
import { argentinaInstrumentRegistry } from "@/lib/argentina/argentina-instrument-registry";
import { cedearUnderlyingSymbols } from "@/lib/instruments/cedearMappings";
import { getMarketData } from "@/lib/market-data";
import { getData912LiveQuotes } from "@/lib/providers/data912-provider";
import { calculateImpliedCcl } from "./ccl";
import { getMockCedear } from "./mock-cedears";
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
      price: response.isFallback ? null : latestClose(response.candles),
      usedProvider: !response.isFallback && response.provider !== "mock" && response.candles.length > 0,
      sourceLabel: response.isFallback ? "Subyacente no disponible" : "Subyacente con dato de mercado",
    };
  } catch {
    return {
      price: null,
      usedProvider: false,
      sourceLabel: "Subyacente no disponible",
    };
  }
}

async function getLocalCedearQuote(instrument: CedearInstrument) {
  try {
    const quote = await getArgentinaQuote(instrument.localSymbol);
    if (quote.isRealData && typeof quote.price === "number" && Number.isFinite(quote.price) && quote.price > 0) {
      return {
        price: quote.price,
        usedProvider: true,
        sourceLabel: "Mercado local CEDEAR",
      };
    }
  } catch {
    // The public result stays unavailable when no provider responds.
  }

  return {
    price: null,
    usedProvider: false,
    sourceLabel: "Precio local no disponible",
  };
}

function getRegistryCedear(symbol: string): CedearInstrument | null {
  const normalized = symbol.trim().toUpperCase();
  const registryInstrument = argentinaInstrumentRegistry.find((instrument) =>
    instrument.type === "cedear" && (instrument.symbol === normalized || instrument.localSymbol === normalized),
  );
  const fallback = getMockCedear(normalized);

  if (!registryInstrument && !fallback) return null;

  const localSymbol = registryInstrument?.localSymbol ?? registryInstrument?.symbol ?? fallback?.localSymbol ?? normalized;
  const mapping = cedearUnderlyingSymbols[localSymbol];
  const underlyingSymbol = mapping?.underlyingSymbol
    ?? registryInstrument?.underlyingSymbol
    ?? fallback?.underlyingSymbol
    ?? localSymbol;

  return {
    localSymbol,
    underlyingSymbol,
    underlyingName: fallback?.underlyingName ?? registryInstrument?.name ?? `${underlyingSymbol} subyacente`,
    localMarket: "BYMA",
    underlyingMarket: fallback?.underlyingMarket ?? "NASDAQ",
    localCurrency: "ARS",
    underlyingCurrency: "USD",
    ratio: registryInstrument?.cedearRatio ?? fallback?.ratio ?? null,
    localPrice: null,
    sourceLabel: "",
    isMock: false,
    status: "unavailable",
  };
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
        "Local CEDEAR price or underlying price is unavailable.",
        "Ratio comes from the local instrument registry and should be reviewed when the program changes.",
        "This module is informational and not a trading signal.",
      ],
    };
  }

  const spreadText = typeof cclSpread === "number" ? `${(cclSpread * 100).toFixed(2)}%` : "not available";

  return {
    label: usedProvider ? "CEDEAR market calculation" : "CEDEAR reference calculation",
    tone: "neutral",
    summary: `The implied CCL is calculated from local CEDEAR price, ratio and underlying USD price. Spread versus reference CCL is ${spreadText}.`,
    bulletPoints: [
      "Local CEDEAR price uses the best available local market feed.",
      "Ratio comes from the local instrument registry and should be reviewed when the program changes.",
      usedProvider ? "Underlying price used market data when available." : "Underlying price used a registry reference.",
    ],
  };
}

export async function getCedearAnalytics(symbol: string): Promise<CedearAnalytics | null> {
  const instrument = getRegistryCedear(symbol);
  if (!instrument) return null;

  const localQuote = await getLocalCedearQuote(instrument);
  const underlying = await getUnderlyingPrice(instrument);
  const impliedCcl = localQuote.price === null || underlying.price === null || instrument.ratio === null
    ? null
    : calculateImpliedCcl(localQuote.price, underlying.price, instrument.ratio);
  const status: CedearStatus = localQuote.usedProvider ? "local_provider" : underlying.usedProvider ? "provider_underlying" : "unavailable";
  const isMock = false;

  return {
    localSymbol: instrument.localSymbol,
    underlyingSymbol: instrument.underlyingSymbol,
    underlyingName: instrument.underlyingName,
    ratio: instrument.ratio,
    localPrice: localQuote.price,
    underlyingPrice: underlying.price,
    impliedCcl,
    cclSpread: null,
    sourceLabel: `${localQuote.sourceLabel}; ${underlying.sourceLabel}; CCL calculado con datos disponibles`,
    isMock,
    status,
    interpretation: buildInterpretation({ impliedCcl, cclSpread: null, usedProvider: underlying.usedProvider }),
    warnings: [
      ...(localQuote.usedProvider ? [] : ["Local CEDEAR price is unavailable from the configured providers."]),
      ...(instrument.ratio === null ? ["CEDEAR ratio is not available in the local registry, so implied CCL is not calculated."] : ["CEDEAR ratio comes from the local instrument registry and should be reviewed when the program changes."]),
      "Implied CCL is informational and depends on price/ratio convention.",
      "Technical and fundamental analysis is based on the underlying asset when CEDEAR-specific history is unavailable.",
    ],
  };
}

export async function getAllCedearAnalytics(): Promise<CedearAnalytics[]> {
  const registryCedears = argentinaInstrumentRegistry
    .filter((instrument) => instrument.type === "cedear")
    .map((instrument) => getRegistryCedear(instrument.symbol))
    .filter((instrument): instrument is CedearInstrument => Boolean(instrument));

  const localQuotes = await getData912LiveQuotes("arg_cedears").catch(() => []);
  const localQuoteMap = new Map(localQuotes.map((quote) => [quote.symbol.trim().toUpperCase(), quote]));

  return registryCedears.map((instrument) => {
    const quote = localQuoteMap.get(instrument.localSymbol);
    const localPrice = typeof quote?.c === "number" && Number.isFinite(quote.c) && quote.c > 0 ? quote.c : null;
    const status: CedearStatus = localPrice === null ? "unavailable" : "local_provider";

    return {
      localSymbol: instrument.localSymbol,
      underlyingSymbol: instrument.underlyingSymbol,
      underlyingName: instrument.underlyingName,
      ratio: instrument.ratio,
      localPrice,
      underlyingPrice: null,
      impliedCcl: null,
      cclSpread: null,
      sourceLabel: localPrice === null ? "Precio local no disponible" : "Mercado local CEDEAR",
      isMock: false,
      status,
      interpretation: buildInterpretation({ impliedCcl: null, cclSpread: null, usedProvider: false }),
      warnings: instrument.ratio === null
        ? ["CEDEAR ratio is not available in the local registry, so implied CCL is not calculated."]
        : [],
    };
  });
}
