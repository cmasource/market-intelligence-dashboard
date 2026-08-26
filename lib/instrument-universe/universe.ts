import { instrumentMasterSeed } from "@/lib/instruments/instrument-master.seed";
import type { Instrument } from "@/lib/instruments/types";
import type {
  InstrumentCategory,
  InstrumentCountry,
  InstrumentMarket,
  InstrumentSourceStatus,
  InstrumentUniverseItem,
} from "./types";

function categoryFromInstrument(instrument: Instrument): InstrumentCategory {
  if (instrument.assetClass === "adr") return "adr";
  if (instrument.assetClass === "cedear" || instrument.assetClass === "cedear_etf") return "cedear";
  if (instrument.assetClass === "etf") return "etf";
  if (instrument.assetClass === "crypto") return "crypto";
  if (instrument.assetClass === "bill") return "letra";
  if (instrument.assetClass === "bond") return "sovereign_bond";
  if (instrument.assetClass === "corporate_bond") return "corporate_bond";
  if (instrument.assetClass === "index") return "index";
  return "equity";
}

function countryFromInstrument(instrument: Instrument): InstrumentCountry {
  if (instrument.market === "argentina") return "AR";
  if (instrument.market === "us") return instrument.assetClass === "adr" ? "AR" : "US";
  if (instrument.market === "crypto" || instrument.market === "global") return "GLOBAL";
  return "UNKNOWN";
}

function marketFromInstrument(instrument: Instrument): InstrumentMarket {
  if (instrument.market === "argentina") return "BYMA";
  if (instrument.market === "crypto") return "CRYPTO";
  if (instrument.exchange === "NYSE Arca") return "NYSE_ARCA";
  if (instrument.exchange === "NYSE") return "NYSE";
  if (instrument.exchange === "NASDAQ") return "NASDAQ";
  return "UNKNOWN";
}

function sourceStatusFromInstrument(instrument: Instrument): InstrumentSourceStatus {
  if (instrument.dataCapabilities.includes("technical_full") || instrument.dataCapabilities.includes("technical_underlying")) {
    return "real_supported";
  }
  if (instrument.dataCapabilities.includes("quote_only")) return "real_supported";
  return "future_supported";
}

function toUniverseItem(instrument: Instrument, index: number): InstrumentUniverseItem {
  const category = categoryFromInstrument(instrument);
  const country = countryFromInstrument(instrument);
  const market = marketFromInstrument(instrument);
  const hasTechnical = instrument.dataCapabilities.includes("technical_full") || instrument.dataCapabilities.includes("technical_underlying");
  const hasFundamentals = instrument.dataCapabilities.includes("fundamentals_full") || instrument.dataCapabilities.includes("fundamentals_underlying");
  const isFixedIncome = ["bond", "bill", "corporate_bond"].includes(instrument.assetClass);

  return {
    instrumentId: instrument.id,
    symbol: instrument.symbol,
    displayName: instrument.name,
    displayNameEn: instrument.name,
    displayNameEs: instrument.name,
    shortName: instrument.displaySymbol,
    category,
    country,
    market,
    currency: instrument.currency,
    localTicker: instrument.bymaSymbol,
    globalTicker: instrument.providerSymbol,
    displayCurrency: instrument.currency,
    quoteCurrency: instrument.currency,
    tradingCurrency: instrument.currency,
    settlementContext: instrument.settlementPeriods?.join(" / "),
    settlementContextEn: instrument.settlementPeriods?.join(" / "),
    settlementContextEs: instrument.settlementPeriods?.join(" / "),
    exchange: instrument.exchange,
    sourceStatus: sourceStatusFromInstrument(instrument),
    dataCoverage: {
      price: instrument.dataCapabilities.some((capability) => ["technical_full", "technical_underlying", "quote_only"].includes(capability)),
      technical: hasTechnical,
      fundamentals: hasFundamentals,
      fixedIncome: isFixedIncome,
      news: hasTechnical || hasFundamentals,
    },
    searchableAliases: [
      instrument.displaySymbol,
      instrument.providerSymbol,
      instrument.tradingViewSymbol,
      instrument.bymaSymbol,
      instrument.underlyingSymbol,
      ...(instrument.aliases ?? []),
    ].filter((value): value is string => Boolean(value)),
    priority: instrument.enabled ? 1000 - index : 0,
    primarySymbol: instrument.providerSymbol ?? instrument.symbol,
    underlyingSymbol: instrument.underlyingSymbol,
    underlyingName: instrument.underlyingSymbol,
    relatedSymbols: Array.from(new Set([
      instrument.symbol,
      instrument.providerSymbol,
      instrument.bymaSymbol,
      instrument.underlyingSymbol,
      ...(instrument.aliases ?? []),
    ].filter((value): value is string => Boolean(value)))),
    relationType: category === "cedear"
      ? "cedear"
      : category === "adr"
        ? "adr"
        : instrument.market === "argentina" && instrument.assetClass === "stock"
          ? "local_equity"
          : undefined,
    isPrimary: instrument.market !== "argentina",
    isSearchable: instrument.enabled,
    tags: instrument.tags,
    description: instrument.warnings[0],
    descriptionEn: instrument.warnings[0],
    descriptionEs: instrument.warnings[0],
  };
}

const uniqueByKey = new Map<string, InstrumentUniverseItem>();

instrumentMasterSeed.forEach((instrument, index) => {
  const item = toUniverseItem(instrument, index);
  uniqueByKey.set(`${item.market}:${item.category}:${item.symbol}`, item);
});

export const instrumentUniverse = Array.from(uniqueByKey.values());
