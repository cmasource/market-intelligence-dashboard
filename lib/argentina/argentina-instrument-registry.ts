import type { ArgentinaInstrument } from "./types";

function equity(symbol: string, name: string): ArgentinaInstrument {
  return {
    symbol,
    displaySymbol: symbol,
    name,
    type: "equity",
    market: "BYMA",
    currency: "ARS",
    quoteCurrency: "ARS",
    sourceStatus: "mock",
  };
}

function bond(input: Omit<ArgentinaInstrument, "market" | "currency" | "sourceStatus"> & { currency?: string }): ArgentinaInstrument {
  return {
    ...input,
    market: "BYMA",
    currency: input.currency ?? input.quoteCurrency,
    sourceStatus: "mock",
  };
}

function cedear(symbol: string, name: string, ratio: number): ArgentinaInstrument {
  return {
    symbol,
    displaySymbol: `${symbol} CEDEAR`,
    localSymbol: symbol,
    name,
    type: "cedear",
    localInstrumentType: "cedear",
    market: "BYMA",
    currency: "ARS",
    quoteCurrency: "ARS",
    underlyingSymbol: symbol,
    cedearRatio: ratio,
    sourceStatus: "mock",
    context: "BYMA CEDEAR",
  };
}

export const argentinaInstrumentRegistry: ArgentinaInstrument[] = [
  equity("GGAL", "Grupo Financiero Galicia"),
  equity("YPFD", "YPF Sociedad Anonima"),
  equity("PAMP", "Pampa Energia"),
  equity("TXAR", "Ternium Argentina"),
  equity("ALUA", "Aluar Aluminio Argentino"),
  equity("TGSU2", "Transportadora de Gas del Sur"),
  equity("CEPU", "Central Puerto"),
  equity("COME", "Sociedad Comercial del Plata"),
  equity("BYMA", "Bolsas y Mercados Argentinos"),
  equity("SUPV", "Grupo Supervielle"),
  equity("VALO", "Grupo Financiero Valores"),
  bond({
    symbol: "AL30",
    displaySymbol: "AL30",
    name: "Bonar 2030",
    type: "sovereign_bond",
    quoteCurrency: "ARS",
    speciesType: "peso_species",
    underlyingSymbol: "AL30",
    maturityDate: "2030-07-09",
    law: "Local law",
  }),
  bond({
    symbol: "AL30D",
    displaySymbol: "AL30D",
    name: "Bonar 2030 - Dollar MEP species",
    type: "sovereign_bond",
    quoteCurrency: "USD",
    speciesType: "dollar_mep_species",
    underlyingSymbol: "AL30",
    maturityDate: "2030-07-09",
    law: "Local law",
  }),
  bond({
    symbol: "AL30C",
    displaySymbol: "AL30C",
    name: "Bonar 2030 - Dollar cable/CCL species",
    type: "sovereign_bond",
    quoteCurrency: "USD",
    speciesType: "dollar_cable_species",
    underlyingSymbol: "AL30",
    maturityDate: "2030-07-09",
    law: "Local law",
  }),
  bond({
    symbol: "GD30",
    displaySymbol: "GD30",
    name: "Global 2030",
    type: "sovereign_bond",
    quoteCurrency: "ARS",
    speciesType: "peso_species",
    underlyingSymbol: "GD30",
    maturityDate: "2030-07-09",
    law: "New York law",
  }),
  bond({
    symbol: "GD30D",
    displaySymbol: "GD30D",
    name: "Global 2030 - Dollar MEP species",
    type: "sovereign_bond",
    quoteCurrency: "USD",
    speciesType: "dollar_mep_species",
    underlyingSymbol: "GD30",
    maturityDate: "2030-07-09",
    law: "New York law",
  }),
  bond({
    symbol: "GD30C",
    displaySymbol: "GD30C",
    name: "Global 2030 - Dollar cable/CCL species",
    type: "sovereign_bond",
    quoteCurrency: "USD",
    speciesType: "dollar_cable_species",
    underlyingSymbol: "GD30",
    maturityDate: "2030-07-09",
    law: "New York law",
  }),
  bond({
    symbol: "TX26",
    displaySymbol: "TX26",
    name: "CER-linked Argentine Treasury bond",
    type: "treasury_bill",
    quoteCurrency: "ARS",
    underlyingSymbol: "TX26",
    maturityDate: "2026-11-09",
    indexation: "CER",
    law: "Local law",
  }),
  bond({
    symbol: "S31Y6",
    displaySymbol: "S31Y6",
    name: "Sample Lecap",
    type: "lecaps",
    quoteCurrency: "ARS",
    underlyingSymbol: "S31Y6",
    maturityDate: "2026-05-31",
    law: "Local law",
  }),
  cedear("AAPL", "Apple CEDEAR", 10),
  cedear("MSFT", "Microsoft CEDEAR", 5),
  cedear("NVDA", "NVIDIA CEDEAR", 24),
  cedear("TSLA", "Tesla CEDEAR", 15),
  cedear("KO", "Coca-Cola CEDEAR", 5),
  cedear("SPY", "SPY CEDEAR", 20),
  cedear("QQQ", "QQQ CEDEAR", 20),
];

export function getArgentinaInstrumentFromRegistry(symbol: string) {
  const normalized = symbol.trim().toUpperCase();
  return argentinaInstrumentRegistry.find((instrument) => instrument.symbol === normalized) ?? null;
}

export function isArgentinaInstrument(symbol: string) {
  return Boolean(getArgentinaInstrumentFromRegistry(symbol));
}
