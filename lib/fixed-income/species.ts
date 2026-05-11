import type { SpeciesType } from "./types";

const speciesGroups: Record<string, string[]> = {
  AL30: ["AL30", "AL30D", "AL30C"],
  GD30: ["GD30", "GD30D", "GD30C"],
  TX26: ["TX26"],
};

export function normalizeBondSpeciesSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

export function getUnderlyingBondSymbol(symbol: string) {
  const normalized = normalizeBondSpeciesSymbol(symbol);

  if (normalized === "AL30D" || normalized === "AL30C") return "AL30";
  if (normalized === "GD30D" || normalized === "GD30C") return "GD30";
  return normalized;
}

export function getBondSpeciesType(symbol: string): SpeciesType {
  const normalized = normalizeBondSpeciesSymbol(symbol);

  if (normalized === "TX26") return "cer";
  if (normalized.endsWith("D")) return "dollar_mep";
  if (normalized.endsWith("C")) return "dollar_cable";
  if (normalized === "AL30" || normalized === "GD30") return "peso";
  return "unknown";
}

export function getRelatedBondSpecies(symbol: string) {
  const underlying = getUnderlyingBondSymbol(symbol);
  return speciesGroups[underlying] ? [...speciesGroups[underlying]] : [normalizeBondSpeciesSymbol(symbol)];
}

export function isPesoSpecies(symbol: string) {
  return getBondSpeciesType(symbol) === "peso";
}

export function isDollarMEPSpecies(symbol: string) {
  return getBondSpeciesType(symbol) === "dollar_mep";
}

export function isDollarCableSpecies(symbol: string) {
  return getBondSpeciesType(symbol) === "dollar_cable";
}

export function getBondSpeciesDisplayLabel(symbol: string, language: "en" | "es" = "en") {
  const type = getBondSpeciesType(symbol);
  const labels: Record<"en" | "es", Record<SpeciesType, string>> = {
    en: {
      peso: "Peso trading species",
      dollar_mep: "Dollar MEP species",
      dollar_cable: "Dollar cable/CCL species",
      cer: "CER-linked ARS bond",
      unknown: "Unknown bond species",
    },
    es: {
      peso: "Especie en pesos",
      dollar_mep: "Especie dolar MEP",
      dollar_cable: "Especie dolar cable/CCL",
      cer: "Bono CER en pesos",
      unknown: "Especie no identificada",
    },
  };

  return labels[language][type];
}
