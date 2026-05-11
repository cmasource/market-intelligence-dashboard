import { estimateAccruedInterestFromInstrument } from "./accrued-interest";
import { buildFixedIncomeCashFlows } from "./cashflows";
import { calculateConvexity } from "./convexity";
import { calculateMacaulayDurationFromCashFlows, calculateModifiedDuration } from "./duration";
import { getAllMockFixedIncomeInstruments, getMockFixedIncomeInstrument } from "./mock-bonds";
import { calculateCleanPrice, calculateCurrentYield, calculateDirtyPrice, calculateParity } from "./pricing";
import { buildFixedIncomeInterpretation, buildFixedIncomeRiskProfile } from "./risk";
import type { FixedIncomeAnalytics } from "./types";
import { calculatePresentValueForCashFlows, estimateFixedIncomeYTM } from "./yield";

function buildAnalyticsForInstrument(instrument: NonNullable<ReturnType<typeof getMockFixedIncomeInstrument>>): FixedIncomeAnalytics {
  const accruedInterest = estimateAccruedInterestFromInstrument(instrument);
  const cleanPrice =
    typeof instrument.cleanPrice === "number"
      ? instrument.cleanPrice
      : typeof instrument.dirtyPrice === "number" && accruedInterest !== null
        ? calculateCleanPrice(instrument.dirtyPrice, accruedInterest)
        : instrument.marketPrice;
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
    "Mock fixed income data; not official bond terms.",
    "Market price is treated as clean price for this MVP unless dirty price is provided.",
    "Accrued interest is simplified without settlement-date precision.",
    "Cash-flow schedules are simplified and do not represent official amortization calendars.",
    ...(instrument.couponType === "cer_adjusted" ? ["CER adjustment is simplified and not fully indexed."] : []),
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
  const instrument = getMockFixedIncomeInstrument(symbol);

  if (!instrument) {
    throw new Error(`Unsupported fixed income symbol: ${symbol}`);
  }

  return buildAnalyticsForInstrument(instrument);
}

export async function getFixedIncomeComparison() {
  const { buildBondComparisonItems } = await import("./comparison");
  return buildBondComparisonItems(getAllMockFixedIncomeInstruments());
}

export { buildAnalyticsForInstrument };
