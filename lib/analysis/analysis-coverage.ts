import { getInstrumentBySymbol } from "@/lib/instrument-universe";
import { instrumentUniverse } from "@/lib/instrument-universe/universe";
import type { InstrumentUniverseItem } from "@/lib/instrument-universe/types";
import { getTradingViewSymbol } from "@/lib/tradingview/symbol-map";
import { getFundamentalProviderSymbol, getMarketDataProviderSymbol, getUnderlyingMapping } from "@/lib/instruments";
import { findAsset } from "@/lib/mock-data";

export type AnalysisCoverageStatus = "provider" | "fallback" | "mock" | "manual" | "not_applicable" | "unavailable";

export type AnalysisCoverageLayer = {
  status: AnalysisCoverageStatus;
  reason?: string;
  source?: string;
  underlyingSymbol?: string;
};

export type AnalysisCoverage = {
  symbol: string;
  assetType: string;
  market?: string;
  technical: AnalysisCoverageLayer;
  fundamentals: AnalysisCoverageLayer;
  fixedIncome: AnalysisCoverageLayer;
  chart: {
    tradingViewSymbol?: string;
    verified: boolean;
  };
};

const bondCategories = new Set(["sovereign_bond", "global_bond", "cer_bond", "dollar_linked_bond", "corporate_bond", "letra", "lecap"]);
const equityLikeCategories = new Set(["equity", "adr", "cedear", "etf"]);

function resolveInstrument(symbol: string): InstrumentUniverseItem | undefined {
  return getInstrumentBySymbol(symbol) ?? instrumentUniverse.find((item) => item.symbol.toUpperCase() === symbol.trim().toUpperCase());
}

function technicalCoverage(symbol: string, instrument?: InstrumentUniverseItem): AnalysisCoverageLayer {
  const providerMapping = getMarketDataProviderSymbol(symbol);

  if (instrument?.category && bondCategories.has(instrument.category)) {
    return {
      status: "unavailable",
      source: "quote_only",
      reason: "Los bonos tienen cobertura de cotizacion; no se publica score tecnico sin una serie OHLCV validada.",
    };
  }

  if (providerMapping.verified) {
    return {
      status: "provider",
      source: providerMapping.provider,
      reason: "Análisis técnico disponible con datos de proveedor o proveedor compatible.",
    };
  }

  return {
    status: "unavailable",
    source: "unavailable",
    reason: "No hay velas OHLCV verificadas para este instrumento.",
  };
}

function fundamentalsCoverage(symbol: string, instrument?: InstrumentUniverseItem): AnalysisCoverageLayer {
  const category = instrument?.category;

  if (category === "crypto") {
    return {
      status: "not_applicable",
      source: "not_applicable",
      reason: "Fundamentos accionarios no aplicables para criptoactivos.",
    };
  }

  if (category && bondCategories.has(category)) {
    return {
      status: "not_applicable",
      source: "fixed_income",
      reason: "Fundamentos accionarios no aplicables para instrumentos de renta fija.",
    };
  }

  const fundamentalMapping = getFundamentalProviderSymbol(symbol);
  if (fundamentalMapping.provider !== "unavailable" && fundamentalMapping.verified) {
    return {
      status: "provider",
      source: fundamentalMapping.provider,
      underlyingSymbol: fundamentalMapping.providerSymbol,
      reason:
        fundamentalMapping.providerSymbol === fundamentalMapping.internalSymbol
          ? "Análisis fundamental disponible con proveedor."
          : `Fundamentos basados en el activo subyacente: ${fundamentalMapping.providerSymbol}.`,
    };
  }

  if (category && equityLikeCategories.has(category) && instrument?.dataCoverage.fundamentals) {
    const underlying = getUnderlyingMapping(symbol);
    return {
      status: "fallback",
      source: instrument.sourceStatus,
      underlyingSymbol: underlying.underlyingSymbol,
      reason: "Cobertura fundamental parcial: algunos campos no están disponibles en el proveedor actual.",
    };
  }

  return {
    status: "unavailable",
    source: "unavailable",
    reason: "Fundamentos no disponibles desde el proveedor actual.",
  };
}

function fixedIncomeCoverage(_symbol: string, instrument?: InstrumentUniverseItem): AnalysisCoverageLayer {
  const category = instrument?.category;

  if (!category || !bondCategories.has(category)) {
    return {
      status: "not_applicable",
      source: "not_applicable",
      reason: "Analítica de renta fija no aplicable para este tipo de instrumento.",
    };
  }

  return {
    status: "unavailable",
    source: "official_terms_required",
    reason: "La cotizacion puede estar disponible, pero TIR, paridad y duration requieren terminos y cashflows oficiales validados.",
  };
}

export function getAnalysisCoverage(symbol: string): AnalysisCoverage {
  const normalizedSymbol = symbol.trim().toUpperCase();
  const instrument = resolveInstrument(normalizedSymbol);
  const chart = getTradingViewSymbol(normalizedSymbol);

  return {
    symbol: normalizedSymbol,
    assetType: instrument?.category ?? findAsset(normalizedSymbol)?.type ?? "unknown",
    market: instrument?.market ?? findAsset(normalizedSymbol)?.market,
    technical: technicalCoverage(normalizedSymbol, instrument),
    fundamentals: fundamentalsCoverage(normalizedSymbol, instrument),
    fixedIncome: fixedIncomeCoverage(normalizedSymbol, instrument),
    chart: {
      tradingViewSymbol: chart.tradingViewSymbol,
      verified: chart.verified,
    },
  };
}

export function getAnalysisCoverageUniverse(type?: string) {
  return instrumentUniverse
    .filter((instrument) => {
      if (!type) return true;
      if (type === "bond") return bondCategories.has(instrument.category);
      if (type === "equity") return instrument.category === "equity" || instrument.category === "adr" || instrument.category === "cedear";
      if (type === "etf") return instrument.category === "etf";
      if (type === "argentina") return instrument.country === "AR";
      if (type === "crypto") return instrument.category === "crypto";
      return instrument.category === type;
    })
    .map((instrument) => getAnalysisCoverage(instrument.symbol));
}

export function getAnalysisCoverageSummary(items = getAnalysisCoverageUniverse()) {
  return {
    universeSize: items.length,
    technicalCount: items.filter((item) => item.technical.status === "provider" || item.technical.status === "manual").length,
    fundamentalCount: items.filter((item) => item.fundamentals.status === "provider" || item.fundamentals.status === "fallback" || item.fundamentals.status === "manual").length,
    fixedIncomeCount: items.filter((item) => item.fixedIncome.status === "provider" || item.fixedIncome.status === "manual").length,
    chartCount: items.filter((item) => item.chart.verified).length,
  };
}
