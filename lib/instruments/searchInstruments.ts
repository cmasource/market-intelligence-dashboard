import { instrumentMasterSeed } from "./instrument-master.seed";
import { normalizeInstrumentQuery } from "./normalizeInstrumentQuery";
import type { Instrument, InstrumentDataCapability, InstrumentSearchResult } from "./types";

const capabilityRank: Record<InstrumentDataCapability, number> = {
  technical_full: 0,
  technical_underlying: 1,
  quote_only: 2,
  fundamentals_full: 3,
  fundamentals_underlying: 4,
  unsupported: 5,
};

function searchableText(instrument: Instrument) {
  return [
    instrument.symbol,
    instrument.displaySymbol,
    instrument.name,
    instrument.providerSymbol,
    instrument.tradingViewSymbol,
    instrument.bymaSymbol,
    instrument.underlyingSymbol,
    instrument.exchange,
    instrument.assetClass,
    instrument.market,
    ...(instrument.aliases ?? []),
    ...instrument.tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();
}

function primaryCapability(instrument: Instrument) {
  return [...instrument.dataCapabilities].sort((a, b) => capabilityRank[a] - capabilityRank[b])[0] ?? "unsupported";
}

function matchScore(instrument: Instrument, query: string) {
  const normalizedSymbol = instrument.symbol.toUpperCase();
  const displaySymbol = instrument.displaySymbol.toUpperCase();
  const aliases = (instrument.aliases ?? []).map((alias) => alias.toUpperCase());
  if (normalizedSymbol === query || displaySymbol === query || instrument.id.toUpperCase() === query) return 0;
  if (instrument.providerSymbol?.toUpperCase() === query || instrument.bymaSymbol?.toUpperCase() === query) return 1;
  if (aliases.includes(query)) return 2;
  if (normalizedSymbol.startsWith(query) || displaySymbol.startsWith(query)) return 3;
  if (instrument.name.toUpperCase().startsWith(query)) return 4;
  if (searchableText(instrument).includes(query)) return 5;
  return 99;
}

export function getInstrumentBadges(instrument: Instrument) {
  const badges: string[] = [];
  if (instrument.market === "us") badges.push("US");
  if (instrument.market === "argentina") badges.push("BYMA");
  if (instrument.assetClass === "adr") badges.push("ADR");
  if (instrument.assetClass === "cedear") badges.push("CEDEAR");
  if (instrument.assetClass === "cedear_etf") badges.push("CEDEAR ETF");
  if (instrument.assetClass === "bond" || instrument.assetClass === "bill") badges.push("Bono");
  if (instrument.assetClass === "corporate_bond") badges.push("ON");
  if (instrument.assetClass === "crypto") badges.push("Crypto");
  if (instrument.dataCapabilities.includes("technical_full")) badges.push("Tecnico completo");
  if (instrument.dataCapabilities.includes("technical_underlying")) badges.push("Tecnico subyacente");
  if (instrument.dataCapabilities.includes("quote_only") && !instrument.dataCapabilities.includes("technical_full")) badges.push("Solo cotizacion");
  return badges;
}

export function searchInstruments(params: { query: string; limit?: number }) {
  const query = normalizeInstrumentQuery(params.query);
  const limit = Math.max(1, Math.min(params.limit ?? 12, 50));
  if (query.length < 2) return [];

  return instrumentMasterSeed
    .map((instrument): InstrumentSearchResult => ({
      ...instrument,
      matchScore: matchScore(instrument, query),
      badges: getInstrumentBadges(instrument),
    }))
    .filter((instrument) => instrument.matchScore < 99)
    .sort((a, b) => {
      if (a.matchScore !== b.matchScore) return a.matchScore - b.matchScore;
      if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
      const capabilityDiff = capabilityRank[primaryCapability(a)] - capabilityRank[primaryCapability(b)];
      if (capabilityDiff !== 0) return capabilityDiff;
      return a.displaySymbol.localeCompare(b.displaySymbol);
    })
    .slice(0, limit);
}
