import { estimateAccruedInterestFromInstrument } from "./accrued-interest";
import { buildFixedIncomeCashFlows } from "./cashflows";
import { calculateConvexity } from "./convexity";
import { calculateMacaulayDurationFromCashFlows, calculateModifiedDuration } from "./duration";
import { getArgentinaQuote } from "@/lib/argentina/argentina-market-data-service";
import { getFixedIncomeInstrumentReference, getFixedIncomeInstrumentReferences } from "./instrument-reference";
import { calculateCleanPrice, calculateCurrentYield, calculateDirtyPrice, calculateParity } from "./pricing";
import { buildFixedIncomeInterpretation, buildFixedIncomeRiskProfile } from "./risk";
import type { FixedIncomeAnalytics, FixedIncomeInstrument } from "./types";
import { calculatePresentValueForCashFlows, estimateFixedIncomeYTM } from "./yield";

function buildAnalyticsForInstrument(instrument: FixedIncomeInstrument): FixedIncomeAnalytics {
  const accruedInterest = estimateAccruedInterestFromInstrument(instrument);
  const normalizedPrice = instrument.analyticalPrice ?? instrument.marketPrice;
  const cleanPrice =
    typeof instrument.cleanPrice === "number"
      ? instrument.cleanPrice
      : typeof instrument.dirtyPrice === "number" && accruedInterest !== null
        ? calculateCleanPrice(instrument.dirtyPrice, accruedInterest)
        : normalizedPrice;
  const dirtyPrice =
    typeof instrument.dirtyPrice === "number"
      ? instrument.dirtyPrice
      : accruedInterest !== null
        ? calculateDirtyPrice(cleanPrice, accruedInterest)
        : cleanPrice;
  const annualCoupon = instrument.faceValue * instrument.annualCouponRate;
  const currentYield = calculateCurrentYield(annualCoupon, cleanPrice);
  const parity = calculateParity(cleanPrice, instrument.faceValue);
  const cashFlows = buildFixedIncomeCashFlows(instrument);
  const estimatedYTM = estimateFixedIncomeYTM(cashFlows, dirtyPrice, instrument.couponFrequency);
  const presentValueCashFlows =
    estimatedYTM === null ? cashFlows : calculatePresentValueForCashFlows(cashFlows, estimatedYTM, instrument.couponFrequency);
  const macaulayDuration =
    estimatedYTM === null
      ? null
      : calculateMacaulayDurationFromCashFlows(cashFlows, estimatedYTM, instrument.couponFrequency);
  const modifiedDuration =
    macaulayDuration === null || estimatedYTM === null
      ? null
      : calculateModifiedDuration(macaulayDuration, estimatedYTM, instrument.couponFrequency);
  const convexity =
    estimatedYTM === null ? null : calculateConvexity(cashFlows, estimatedYTM, dirtyPrice, instrument.couponFrequency);
  const partialAnalytics = {
    modifiedDuration,
    estimatedYTM,
  };
  const risk = buildFixedIncomeRiskProfile(instrument, partialAnalytics);
  const interpretation = buildFixedIncomeInterpretation(instrument, {
    estimatedYTM,
    modifiedDuration,
    parity,
    risk,
  });
  const warnings = [
    ...(instrument.symbol !== instrument.analyticalReferenceSymbol
      ? [`Las metricas usan la especie ${instrument.analyticalReferenceSymbol} como referencia analitica.`]
      : []),
    "La TIR es una estimacion sobre precio de mercado y flujos contractuales remanentes.",
    "No incluye comisiones, impuestos ni diferencias de liquidacion.",
  ];

  return {
    symbol: instrument.symbol,
    name: instrument.name,
    sourceLabel: instrument.sourceLabel,
    isMock: instrument.isMock,
    instrument,
    cleanPrice,
    dirtyPrice,
    accruedInterest,
    currentYield,
    parity,
    estimatedYTM,
    macaulayDuration,
    modifiedDuration,
    convexity,
    cashFlows: presentValueCashFlows,
    risk,
    interpretation,
    warnings,
  };
}

export async function getFixedIncomeAnalytics(symbol: string) {
  const reference = getFixedIncomeInstrumentReference(symbol);

  if (!reference) {
    throw new Error(`Unsupported fixed income symbol: ${symbol}`);
  }

  const instrument = await hydrateMarketPrices(reference);
  if (!instrument) throw new Error(`Market price unavailable for fixed income symbol: ${symbol}`);

  return buildAnalyticsForInstrument(instrument);
}

export async function getFixedIncomeComparison() {
  const { buildBondComparisonItems } = await import("./comparison");
  const instruments = (await Promise.all(getFixedIncomeInstrumentReferences().map(hydrateMarketPrices)))
    .filter((instrument): instrument is FixedIncomeInstrument => instrument !== null);
  return buildBondComparisonItems(instruments);
}

function normalizeAnalyticalPrice(price: number, faceValue: number) {
  if (faceValue === 100 && price > 200) return price / 10;
  return price;
}

async function getBcraUsdReference() {
  try {
    const response = await fetch("https://api.bcra.gob.ar/estadisticascambiarias/v1.0/Cotizaciones", {
      headers: { "Accept-Language": "es-AR" },
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { results?: { detalle?: Array<{ codigoMoneda?: string; tipoCotizacion?: number }> } };
    const usd = payload.results?.detalle?.find((item) => item.codigoMoneda === "USD")?.tipoCotizacion;
    return typeof usd === "number" && Number.isFinite(usd) && usd > 0 ? usd : null;
  } catch {
    return null;
  }
}

async function hydrateMarketPrices(reference: FixedIncomeInstrument): Promise<FixedIncomeInstrument | null> {
  const analyticalSymbol = reference.analyticalReferenceSymbol ?? reference.symbol;
  const [displayQuote, analyticalQuote] = await Promise.all([
    getArgentinaQuote(reference.symbol),
    analyticalSymbol === reference.symbol ? Promise.resolve(null) : getArgentinaQuote(analyticalSymbol),
  ]);
  const analyticalPriceRaw = analyticalQuote?.price ?? displayQuote.price;
  if (typeof analyticalPriceRaw !== "number" || !Number.isFinite(analyticalPriceRaw) || analyticalPriceRaw <= 0) return null;

  const fxReference = reference.currency === "ARS_DOLLAR_LINKED" ? await getBcraUsdReference() : null;
  if (reference.currency === "ARS_DOLLAR_LINKED" && fxReference === null) return null;
  const priceInContractCurrency = fxReference ? analyticalPriceRaw / fxReference : analyticalPriceRaw;
  const analyticalPrice = normalizeAnalyticalPrice(priceInContractCurrency, reference.faceValue);
  return {
    ...reference,
    marketDisplayPrice: displayQuote.price ?? analyticalPrice,
    analyticalPrice,
    marketPrice: analyticalPrice,
  };
}

export { buildAnalyticsForInstrument };
