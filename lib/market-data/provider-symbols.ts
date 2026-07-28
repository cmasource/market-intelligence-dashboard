import { normalizeSymbol } from "./symbol-map";
import { instrumentMasterSeed } from "@/lib/instruments/instrument-master.seed";

const seededProviderQuoteSymbols = [
  "AAPL",
  "MSFT",
  "NVDA",
  "TSLA",
  "AMZN",
  "META",
  "GOOGL",
  "KO",
  "NFLX",
  "AMD",
  "INTC",
  "JPM",
  "BAC",
  "PEP",
  "WMT",
  "DIS",
  "V",
  "MA",
  "XOM",
  "CVX",
  "UNH",
  "JNJ",
  "PG",
  "COST",
  "MCD",
  "NKE",
  "CRM",
  "ORCL",
  "IBM",
  "SPY",
  "QQQ",
  "DIA",
  "IWM",
  "GLD",
  "SLV",
  "TLT",
  "HYG",
  "VOO",
  "VTI",
  "BTC-USD",
  "ETH-USD",
  "SOL-USD",
  "BNB-USD",
  "XRP-USD",
  "ADA-USD",
  "DOGE-USD",
  "AVAX-USD",
  "LINK-USD",
  "DOT-USD",
  "MATIC-USD",
  "POL-USD",
  "LTC-USD",
  "BCH-USD",
];

export const providerQuoteSymbols = new Set([
  ...seededProviderQuoteSymbols,
  ...instrumentMasterSeed
    .filter((instrument) =>
      instrument.providerSymbol
      && (
        instrument.dataCapabilities.includes("technical_underlying")
        || instrument.dataCapabilities.includes("fundamentals_underlying")
        || (
          instrument.market !== "argentina"
          && instrument.dataCapabilities.some((capability) => ["technical_full", "fundamentals_full", "quote_only"].includes(capability))
        )
      ),
    )
    .flatMap((instrument) => [instrument.symbol, instrument.providerSymbol as string, instrument.underlyingSymbol ?? ""])
    .filter(Boolean),
]);

export function isProviderQuoteSupported(symbol: string) {
  return providerQuoteSymbols.has(normalizeSymbol(symbol));
}
