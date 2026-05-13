import type { Asset } from "@/types/asset";

export type FormatterLanguage = "en" | "es";

type InstrumentPriceInput = {
  currency?: string;
  quoteCurrency?: string;
  priceDisplayCurrency?: string;
  displayCurrency?: string;
  speciesType?: string;
  settlementContext?: string;
  indexationType?: string;
  marketDisplayPrice?: number;
  analyticalPrice?: number;
};

export function normalizeDisplayCurrency(rawCurrency = "USD") {
  const normalized = rawCurrency.trim().toUpperCase().replaceAll(" ", "_").replaceAll("-", "_");

  const aliases: Record<string, string> = {
    USDM: "USD_MEP",
    MEP: "USD_MEP",
    USDMEP: "USD_MEP",
    USD_MEP: "USD_MEP",
    USD_CCL: "USD_CABLE",
    USD_CABLE: "USD_CABLE",
    USD_CABLE_CCL: "USD_CABLE",
    CABLE: "USD_CABLE",
    ARS_CER: "ARS_CER",
    ARSCER: "ARS_CER",
    "ARS/CER": "ARS_CER",
    "USD/ARS": "ARS",
    "ARS/USD": "ARS",
  };

  return aliases[normalized] ?? normalized;
}

export function normalizePriceCurrency(rawCurrency = "USD") {
  const normalized = normalizeDisplayCurrency(rawCurrency);

  if (normalized === "USD_MEP" || normalized === "USD_CABLE") return "USD";
  if (normalized === "ARS_CER" || normalized === "ARS_DOLLAR_LINKED") return "ARS";
  if (normalized === "UNKNOWN") return "N/A";
  return normalized;
}

export function isCompositeCurrency(currency = "USD") {
  return ["USD_MEP", "USD_CABLE", "ARS_CER", "ARS_DOLLAR_LINKED"].includes(normalizeDisplayCurrency(currency));
}

export function formatDisplayCurrency(currency = "USD", language: FormatterLanguage = "en") {
  void language;
  const normalized = normalizeDisplayCurrency(currency);

  const labels: Record<string, string> = {
    USD: "USD",
    ARS: "ARS",
    ARS_CER: "ARS",
    USD_MEP: "USD",
    USD_CABLE: "USD",
    ARS_DOLLAR_LINKED: "ARS",
    UNKNOWN: "N/A",
  };

  return labels[normalized] ?? normalized.replaceAll("_", " ");
}

export function getCurrencySuffix(currency = "USD", language: FormatterLanguage = "en") {
  return formatDisplayCurrency(currency, language);
}

export function getCurrencySymbol(currency = "USD") {
  const normalized = normalizePriceCurrency(currency);
  if (normalized === "USD" || normalized === "USD_MEP" || normalized === "USD_CABLE") return "USD";
  if (normalized === "ARS" || normalized === "ARS_CER" || normalized === "ARS_DOLLAR_LINKED") return "ARS";
  return normalized;
}

export function formatCurrencyValue(value: number, currency = "USD", locale: FormatterLanguage | string = "en") {
  const language = locale === "es" ? "es" : "en";
  const normalizedCurrency = normalizePriceCurrency(currency);
  const decimals = Math.abs(value) >= 1000 ? 0 : 2;
  const formattedValue = new Intl.NumberFormat(language === "es" ? "es-AR" : "en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);
  return `${formattedValue} ${formatDisplayCurrency(normalizedCurrency, language)}`;
}

export function getInstrumentPriceValue(value: number, instrument: InstrumentPriceInput = {}) {
  return typeof instrument.marketDisplayPrice === "number" && Number.isFinite(instrument.marketDisplayPrice)
    ? instrument.marketDisplayPrice
    : value;
}

export function getInstrumentPriceCurrency(instrument: InstrumentPriceInput = {}) {
  return normalizePriceCurrency(
    instrument.priceDisplayCurrency ??
      instrument.quoteCurrency ??
      instrument.currency ??
      instrument.displayCurrency ??
      "USD",
  );
}

export function formatInstrumentPrice(
  value: number,
  instrument: InstrumentPriceInput = {},
  locale: FormatterLanguage | string = "en",
) {
  return formatCurrencyValue(getInstrumentPriceValue(value, instrument), getInstrumentPriceCurrency(instrument), locale);
}

export function formatAssetPrice(value: number, asset: Pick<Asset, "currency"> & InstrumentPriceInput, locale: FormatterLanguage | string = "en") {
  return formatInstrumentPrice(value, asset, locale);
}

export function formatCurrency(value: number, currency = "USD", locale: FormatterLanguage | string = "en") {
  return formatCurrencyValue(value, currency, locale);
}

export function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatNumber(value: number, locale: FormatterLanguage | string = "en") {
  return new Intl.NumberFormat(locale === "es" ? "es-AR" : "en-US", {
    maximumFractionDigits: value > 1000 ? 0 : 2,
  }).format(value);
}

export function formatScore(score: number) {
  return `${Math.round(score)}/100`;
}
