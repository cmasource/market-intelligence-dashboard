import { instrumentUniverse } from "./universe";
import type { InstrumentRelationType, InstrumentUniverseItem, RelatedInstrument } from "./types";

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
      cedear: "CEDEAR",
      underlying_stock: "Underlying stock",
      crypto_pair: "Crypto pair",
      benchmark: "Benchmark",
      unknown: "Related instrument",
    },
    es: {
      same_underlying: "Mismo subyacente",
      peso_species: "Especie en pesos",
      dollar_mep_species: "Especie dolar MEP",
      dollar_cable_species: "Especie dolar cable/CCL",
      adr: "ADR",
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

export function getRelatedInstruments(symbol: string): RelatedInstrument[] {
  const instrument = getInstrumentBySymbol(symbol);
  if (!instrument) return [];

  return instrument.relatedSymbols
    .map((relatedSymbol) => getInstrumentBySymbol(relatedSymbol))
    .filter((item): item is InstrumentUniverseItem => Boolean(item))
    .map((item) => {
      const relationType = item.relationType ?? "unknown";
      return {
        symbol: item.symbol,
        displayName: item.displayName,
        category: item.category,
        relationType,
        currency: item.currency,
        market: item.market,
        href: `/asset/${encodeURIComponent(item.symbol)}`,
        label: getInstrumentRelationshipLabel(relationType),
        labelEs: getInstrumentRelationshipLabel(relationType, "es"),
        labelEn: getInstrumentRelationshipLabel(relationType, "en"),
        isPrimary: item.isPrimary,
      };
    });
}

export function getPrimaryInstrument(symbol: string) {
  const instrument = getInstrumentBySymbol(symbol);
  if (!instrument) return null;
  return getInstrumentBySymbol(instrument.primarySymbol ?? instrument.symbol);
}

export function isPrimaryInstrument(symbol: string) {
  return getInstrumentBySymbol(symbol)?.isPrimary ?? false;
}

export function hasRelatedInstruments(symbol: string) {
  return getRelatedInstruments(symbol).length > 1;
}
