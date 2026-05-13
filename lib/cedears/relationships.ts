import { mockCedears } from "./mock-cedears";

function normalize(symbol: string) {
  return symbol.trim().toUpperCase();
}

export function isCedearSymbol(symbol: string) {
  const normalized = normalize(symbol);
  return mockCedears.some((item) => item.localSymbol === normalized);
}

export function getCedearByUnderlyingSymbol(symbol: string) {
  const normalized = normalize(symbol);
  return mockCedears.find((item) => item.underlyingSymbol === normalized) ?? null;
}

export function getUnderlyingForCedear(symbol: string) {
  const normalized = normalize(symbol);
  return mockCedears.find((item) => item.localSymbol === normalized)?.underlyingSymbol ?? null;
}

export function getCedearRelatedSymbols(symbol: string) {
  const normalized = normalize(symbol);
  const cedear = mockCedears.find((item) => item.localSymbol === normalized || item.underlyingSymbol === normalized);
  if (!cedear) return [];
  return Array.from(new Set([cedear.localSymbol, cedear.underlyingSymbol]));
}
