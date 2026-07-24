import { instrumentUniverse } from "@/lib/instrument-universe/universe";
import { DATA_COVERAGE_BY_SYMBOL, getDefaultCoverage } from "./coverage-map";
import type { DataCoverageGroup, DataCoverageLanguage, DataCoverageStatus, InstrumentDataCoverage } from "./types";

export function normalizeCoverageSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

export function getInstrumentDataCoverage(symbol: string): InstrumentDataCoverage {
  const normalized = normalizeCoverageSymbol(symbol);
  return DATA_COVERAGE_BY_SYMBOL[normalized] ?? getDefaultCoverage(normalized);
}

export function getInstrumentContextCoverage(symbol: string, context?: { category?: string; country?: string }): InstrumentDataCoverage {
  const normalized = normalizeCoverageSymbol(symbol);

  if (context?.category === "cedear") {
    return {
      symbol: normalized,
      price: "provider",
      chart: "provider",
      technical: "provider",
      fundamentals: "provider",
      fixedIncome: "not_applicable",
      news: "future",
      aiSummary: "mock",
      notes: ["CEDEAR local price uses the best available local market feed; technical and fundamentals can use the US underlying where CEDEAR-specific history is unavailable."],
    };
  }

  return getInstrumentDataCoverage(normalized);
}

export function getCoverageStatusLabel(status: DataCoverageStatus, language: DataCoverageLanguage) {
  const labels: Record<DataCoverageStatus, { en: string; es: string }> = {
    real: { en: "Real", es: "Real" },
    provider: { en: "Provider", es: "Proveedor" },
    fallback: { en: "Reference", es: "Referencia" },
    mock: { en: "Partial coverage", es: "Cobertura parcial" },
    future: { en: "Future", es: "Futuro" },
    not_applicable: { en: "Not applicable", es: "No aplica" },
    unavailable: { en: "Unavailable", es: "No disponible" },
  };

  return labels[status][language];
}

export function getCoverageGroupForStatus(status: DataCoverageStatus): DataCoverageGroup {
  if (status === "real" || status === "provider") return "real_provider";
  if (status === "mock" || status === "fallback") return "mock_fallback";
  if (status === "not_applicable") return "not_applicable";
  return "future";
}

export function instrumentMatchesCoverageGroup(symbol: string, group?: string, context?: { category?: string; country?: string }) {
  if (!group) return true;
  const coverage = getInstrumentContextCoverage(symbol, context);
  const statuses = [coverage.price, coverage.chart, coverage.technical, coverage.fundamentals, coverage.fixedIncome];
  return statuses.some((status) => getCoverageGroupForStatus(status) === group);
}

export function getCoverageGroupOptions(language: DataCoverageLanguage) {
  return [
    { value: "real_provider", label: language === "es" ? "Real / proveedor" : "Real / provider" },
    { value: "mock_fallback", label: language === "es" ? "Cobertura parcial" : "Partial coverage" },
    { value: "future", label: language === "es" ? "Futuro" : "Future" },
    { value: "not_applicable", label: language === "es" ? "No aplica" : "Not applicable" },
  ];
}

export function getCoverageForUniverse() {
  return instrumentUniverse.map((instrument) => ({
    instrument,
    coverage: getInstrumentContextCoverage(instrument.symbol, {
      category: instrument.category,
      country: instrument.country,
    }),
  }));
}
