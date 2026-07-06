import { getCryptoSymbol, getYahooSymbol, normalizeSymbol } from "@/lib/market-data/symbol-map";
import { getYahooFundamentalsSymbol, normalizeFundamentalsSymbol } from "@/lib/fundamentals-data/symbol-map";
import { getUnderlyingMapping } from "./underlying-map";

export type ProviderSymbolMapping = {
  internalSymbol: string;
  providerSymbol: string;
  provider: "fmp" | "yahoo" | "binance" | "manual" | "mock" | "unavailable";
  verified: boolean;
  reason: string;
};

export function getMarketDataProviderSymbol(symbol: string): ProviderSymbolMapping {
  const internalSymbol = normalizeSymbol(symbol);
  const yahooSymbol = getYahooSymbol(internalSymbol);
  const cryptoSymbol = getCryptoSymbol(internalSymbol);

  if (yahooSymbol) {
    return {
      internalSymbol,
      providerSymbol: yahooSymbol,
      provider: "yahoo",
      verified: true,
      reason: "Yahoo-compatible provider symbol is configured.",
    };
  }

  if (cryptoSymbol) {
    return {
      internalSymbol,
      providerSymbol: cryptoSymbol,
      provider: "binance",
      verified: true,
      reason: "Crypto pair is mapped to a public exchange symbol.",
    };
  }

  return {
    internalSymbol,
    providerSymbol: internalSymbol,
    provider: "mock",
    verified: false,
    reason: "No verified market-data provider symbol configured; fallback may be used.",
  };
}

export function getFundamentalProviderSymbol(symbol: string): ProviderSymbolMapping {
  const internalSymbol = normalizeFundamentalsSymbol(symbol);
  const underlying = getUnderlyingMapping(internalSymbol);
  const providerSymbol = getYahooFundamentalsSymbol(underlying.underlyingSymbol);

  if (providerSymbol) {
    return {
      internalSymbol,
      providerSymbol,
      provider: "fmp",
      verified: underlying.verified,
      reason: underlying.reason,
    };
  }

  return {
    internalSymbol,
    providerSymbol: underlying.underlyingSymbol,
    provider: "unavailable",
    verified: false,
    reason: "No verified fundamentals provider symbol configured.",
  };
}

export { getUnderlyingMapping };

