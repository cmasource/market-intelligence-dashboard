import { instrumentUniverse } from "./universe";
import type { InstrumentCountry, InstrumentMarket, InstrumentSourceStatus, InstrumentUniverseItem } from "./types";
import { instrumentMatchesCoverageGroup } from "@/lib/data-coverage";

export type InstrumentUniverseFilters = {
  query?: string;
  category?: string;
  market?: string;
  country?: string;
  currency?: string;
  sourceStatus?: string;
  coverageGroup?: string;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function buildHaystack(instrument: InstrumentUniverseItem) {
  return [
    instrument.symbol,
    instrument.displayName,
    instrument.shortName,
    instrument.category,
    instrument.country,
    instrument.currency,
    instrument.displayCurrency,
    instrument.market,
    instrument.primarySymbol,
    instrument.underlyingSymbol,
    instrument.localTicker,
    instrument.globalTicker,
    instrument.sector,
    instrument.industry,
    instrument.exchange,
    ...(instrument.relatedSymbols ?? []),
    ...(instrument.tags ?? []),
    ...(instrument.searchableAliases ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function byPriority(left: InstrumentUniverseItem, right: InstrumentUniverseItem) {
  return (right.priority ?? 0) - (left.priority ?? 0) || left.symbol.localeCompare(right.symbol);
}

export function getAllInstruments() {
  return [...instrumentUniverse].sort(byPriority);
}

export function searchInstrumentUniverse(query: string, limit = 12) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return getAllInstruments().slice(0, limit);

  return getAllInstruments()
    .filter((instrument) => instrument.isSearchable && buildHaystack(instrument).includes(normalizedQuery))
    .slice(0, limit);
}

export function filterInstrumentUniverse(filters: InstrumentUniverseFilters = {}) {
  const query = normalize(filters.query ?? "");

  return getAllInstruments().filter((instrument) => {
    if (query && !buildHaystack(instrument).includes(query)) return false;
    if (filters.category && instrument.category !== filters.category) return false;
    if (filters.market && instrument.market !== filters.market) return false;
    if (filters.country && instrument.country !== filters.country) return false;
    if (filters.currency && instrument.currency !== filters.currency) return false;
    if (filters.sourceStatus && instrument.sourceStatus !== filters.sourceStatus) return false;
    if (
      !instrumentMatchesCoverageGroup(instrument.symbol, filters.coverageGroup, {
        category: instrument.category,
        country: instrument.country,
      })
    ) {
      return false;
    }
    return true;
  });
}

function uniqueSorted<T extends string>(values: T[]) {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

export function getInstrumentCategories() {
  return uniqueSorted(instrumentUniverse.map((instrument) => instrument.category));
}

export function getInstrumentMarkets(): InstrumentMarket[] {
  return uniqueSorted(instrumentUniverse.map((instrument) => instrument.market));
}

export function getInstrumentCountries(): InstrumentCountry[] {
  return uniqueSorted(instrumentUniverse.map((instrument) => instrument.country));
}

export function getInstrumentCurrencies() {
  return uniqueSorted(instrumentUniverse.map((instrument) => instrument.currency));
}

export function getInstrumentSourceStatuses(): InstrumentSourceStatus[] {
  return uniqueSorted(instrumentUniverse.map((instrument) => instrument.sourceStatus));
}
