import { instrumentUniverse } from "./universe";
import type { InstrumentRelationType, InstrumentUniverseItem, RelatedInstrument } from "./types";
import { getAssetHref } from "@/lib/instruments/assetHref";

export const INSTRUMENT_UNIVERSE: InstrumentUniverseItem[] = instrumentUniverse;

function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

export function getInstrumentRelationshipLabel(
  relationType: InstrumentRelationType = "unknown",
  language: "en" | "es" = "en",
) {
  const labels: Record<"en" | "es", Record<InstrumentRelationType, string>> = {
    en: {
      same_underlying: "Same underlying",
      peso_species: "Peso species",
      dollar_mep_species: "Dollar MEP species",
      dollar_cable_species: "Dollar cable/CCL species",
      adr: "ADR",
      local_equity: "Local share",
      cedear: "CEDEAR",
      underlying_stock: "Underlying stock",
      crypto_pair: "Crypto pair",
      benchmark: "Benchmark",
      unknown: "Related instrument",
    },
    es: {
      same_underlying: "Mismo subyacente",
      peso_species: "Especie en pesos",
      dollar_mep_species: "Especie dólar MEP",
      dollar_cable_species: "Especie dólar cable/CCL",
      adr: "ADR",
      local_equity: "Accion local",
      cedear: "CEDEAR",
      underlying_stock: "Accion subyacente",
      crypto_pair: "Par cripto",
      benchmark: "Benchmark",
      unknown: "Instrumento relacionado",
    },
  };

  return labels[language][relationType];
}

export function getInstrumentBySymbol(symbol: string) {
  const normalized = normalizeSymbol(symbol);
  return INSTRUMENT_UNIVERSE.find((instrument) => instrument.symbol === normalized) ?? null;
}

export function getUniverseInstrument(params: { symbol: string; instrumentId?: string }) {
  if (params.instrumentId) {
    const byId = INSTRUMENT_UNIVERSE.find((instrument) => instrument.instrumentId === params.instrumentId);
    if (byId) return byId;
  }
  return getInstrumentBySymbol(params.symbol);
}

export function getRelatedInstruments(symbol: string, instrumentId?: string): RelatedInstrument[] {
  const instrument = getUniverseInstrument({ symbol, instrumentId });
  if (!instrument) return [];
  const identitySymbols = new Set(instrument.relatedSymbols.map(normalizeSymbol));
  if (instrument.underlyingSymbol) identitySymbols.add(normalizeSymbol(instrument.underlyingSymbol));

  return INSTRUMENT_UNIVERSE
    .filter((item) => item.instrumentId === instrument.instrumentId
      || identitySymbols.has(normalizeSymbol(item.symbol))
      || Boolean(item.underlyingSymbol && identitySymbols.has(normalizeSymbol(item.underlyingSymbol))))
    .map((item) => {
      const relationType = item.relationType ?? "unknown";
      const relatedInstrumentId = item.instrumentId ?? `${item.category}:${item.symbol}`;
      return {
        instrumentId: relatedInstrumentId,
        symbol: item.symbol,
        displayName: item.displayName,
        category: item.category,
        relationType,
        currency: item.quoteCurrency ?? item.currency,
        market: item.market,
        href: getAssetHref(item.symbol, item.instrumentId),
        label: getInstrumentRelationshipLabel(relationType),
        labelEs: getInstrumentRelationshipLabel(relationType, "es"),
        labelEn: getInstrumentRelationshipLabel(relationType, "en"),
        isPrimary: item.isPrimary,
      };
    });
}

export function getPrimaryInstrument(symbol: string, instrumentId?: string) {
  const instrument = getUniverseInstrument({ symbol, instrumentId });
  if (!instrument) return null;
  const primarySymbol = instrument.underlyingSymbol ?? instrument.primarySymbol ?? instrument.symbol;
  return INSTRUMENT_UNIVERSE.find((candidate) => candidate.symbol === primarySymbol && candidate.country === "US")
    ?? getInstrumentBySymbol(primarySymbol);
}

export function isPrimaryInstrument(symbol: string) {
  return getInstrumentBySymbol(symbol)?.isPrimary ?? false;
}

export function hasRelatedInstruments(symbol: string, instrumentId?: string) {
  return getRelatedInstruments(symbol, instrumentId).length > 1;
}
