import { argentinaInstrumentRegistry } from "@/lib/argentina/argentina-instrument-registry";
import { cedearUnderlyingSymbols } from "@/lib/instruments/cedearMappings";

function normalize(symbol: string) {
  return symbol.trim().toUpperCase();
}

export function isCedearSymbol(symbol: string) {
  const normalized = normalize(symbol);
  return argentinaInstrumentRegistry.some((item) => item.type === "cedear" && item.symbol === normalized);
}

export function getCedearByUnderlyingSymbol(symbol: string) {
  const normalized = normalize(symbol);
  return argentinaInstrumentRegistry.find((item) =>
    item.type === "cedear"
    && (cedearUnderlyingSymbols[item.symbol]?.underlyingSymbol ?? item.underlyingSymbol ?? item.symbol) === normalized,
  ) ?? null;
}

export function getUnderlyingForCedear(symbol: string) {
  const normalized = normalize(symbol);
  const cedear = argentinaInstrumentRegistry.find((item) => item.type === "cedear" && item.symbol === normalized);
  if (!cedear) return null;
  return cedearUnderlyingSymbols[cedear.symbol]?.underlyingSymbol ?? cedear.underlyingSymbol ?? cedear.symbol;
}

export function getCedearRelatedSymbols(symbol: string) {
  const normalized = normalize(symbol);
  const cedear = argentinaInstrumentRegistry.find((item) => {
    if (item.type !== "cedear") return false;
    const underlying = cedearUnderlyingSymbols[item.symbol]?.underlyingSymbol ?? item.underlyingSymbol ?? item.symbol;
    return item.symbol === normalized || underlying === normalized;
  });
  if (!cedear) return [];
  const underlying = cedearUnderlyingSymbols[cedear.symbol]?.underlyingSymbol ?? cedear.underlyingSymbol ?? cedear.symbol;
  return Array.from(new Set([cedear.symbol, underlying]));
}
