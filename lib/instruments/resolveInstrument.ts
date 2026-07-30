import { getTradeRadarProviderStatus } from "@/lib/market-data/trade-radar-provider-status";
import { instrumentMasterSeed } from "./instrument-master.seed";
import { normalizeInstrumentQuery } from "./normalizeInstrumentQuery";
import type { Instrument, InstrumentLayer, InstrumentResolution } from "./types";

function byId(id: string) {
  return instrumentMasterSeed.find((instrument) => instrument.id === id) ?? null;
}

export function getInstrumentById(id: string) {
  return byId(id);
}

function exactCandidates(symbol: string) {
  const normalized = normalizeInstrumentQuery(symbol);
  return instrumentMasterSeed.filter((instrument) =>
    instrument.symbol.toUpperCase() === normalized
    || instrument.displaySymbol.toUpperCase() === normalized
    || instrument.providerSymbol?.toUpperCase() === normalized
    || instrument.bymaSymbol?.toUpperCase() === normalized
    || (instrument.aliases ?? []).some((alias) => alias.toUpperCase() === normalized),
  );
}

function chooseDefault(candidates: Instrument[]) {
  return candidates.sort((a, b) => {
    const aTech = a.dataCapabilities.includes("technical_full") ? 0 : a.dataCapabilities.includes("technical_underlying") ? 1 : 2;
    const bTech = b.dataCapabilities.includes("technical_full") ? 0 : b.dataCapabilities.includes("technical_underlying") ? 1 : 2;
    if (aTech !== bTech) return aTech - bTech;
    if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
    return a.id.localeCompare(b.id);
  })[0] ?? null;
}

function localAlternativesFor(instrument: Instrument) {
  return instrumentMasterSeed.filter((candidate) =>
    candidate.id !== instrument.id
    && candidate.market === "argentina"
    && (candidate.symbol === instrument.symbol
      || candidate.underlyingSymbol === instrument.symbol
      || candidate.providerSymbol === instrument.symbol
      || candidate.aliases?.includes(instrument.symbol)),
  );
}

function technicalLayerFor(instrument: Instrument): InstrumentLayer | null {
  if (instrument.dataCapabilities.includes("technical_full")) {
    return {
      symbol: instrument.assetClass === "crypto" ? instrument.symbol : instrument.providerSymbol ?? instrument.symbol,
      market: instrument.market === "crypto" ? "crypto" : instrument.market === "argentina" ? "argentina" : "us",
      status: "ok",
      description: instrument.assetClass === "crypto"
        ? "cripto OHLCV"
        : instrument.market === "argentina"
          ? "historico local OHLCV"
          : "US OHLCV",
    };
  }
  if (instrument.dataCapabilities.includes("technical_underlying") && instrument.underlyingSymbol) {
    const isInternational = instrument.underlyingMarket === "global";
    return {
      symbol: instrument.underlyingSymbol,
      market: instrument.underlyingMarket === "crypto" ? "crypto" : "us",
      status: "ok",
      description: isInternational ? "subyacente internacional" : "subyacente US",
    };
  }
  return null;
}

function localLayerFor(instrument: Instrument): InstrumentLayer | null {
  if (instrument.market !== "argentina") return null;
  const status = getTradeRadarProviderStatus();
  return {
    symbol: instrument.bymaSymbol ?? instrument.symbol,
    market: "argentina",
    provider: "byma",
    status: status.hasBymaKey ? "ok" : "not_configured",
    description: "cotizacion local BYMA",
  };
}

export function resolveInstrument(params: { symbol?: string; instrumentId?: string }): InstrumentResolution | null {
  const instrument = params.instrumentId
    ? byId(params.instrumentId)
    : chooseDefault(exactCandidates(params.symbol ?? ""));

  if (!instrument) return null;

  return {
    instrument,
    technicalLayer: technicalLayerFor(instrument),
    localLayer: localLayerFor(instrument),
    localAlternatives: localAlternativesFor(instrument),
    warnings: instrument.warnings,
    dataCoverage: instrument.dataCapabilities,
  };
}
