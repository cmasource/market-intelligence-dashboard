import type { FixedIncomeCashFlow, FixedIncomeInstrument } from "./types";

function isValidPositiveNumber(value: number) {
  return Number.isFinite(value) && value > 0;
}

function getAdjustedPrincipal(instrument: FixedIncomeInstrument) {
  if (instrument.couponType === "cer_adjusted" && isValidPositiveNumber(instrument.cerCoefficient ?? 0)) {
    return instrument.faceValue * Number(instrument.cerCoefficient);
  }

  if (instrument.couponType === "dollar_linked" && isValidPositiveNumber(instrument.fxAdjustment ?? 0)) {
    return instrument.faceValue * Number(instrument.fxAdjustment);
  }

  return instrument.faceValue;
}

export function buildFixedIncomeCashFlows(instrument: FixedIncomeInstrument): FixedIncomeCashFlow[] {
  if (
    !isValidPositiveNumber(instrument.faceValue) ||
    !isValidPositiveNumber(instrument.couponFrequency) ||
    !isValidPositiveNumber(instrument.yearsToMaturity)
  ) {
    return [];
  }

  const totalPeriods = Math.max(1, Math.round(instrument.yearsToMaturity * instrument.couponFrequency));
  const principal = getAdjustedPrincipal(instrument);
  const couponPerPeriod =
    instrument.couponType === "zero" || instrument.amortizationType === "zero_coupon"
      ? 0
      : (principal * instrument.annualCouponRate) / instrument.couponFrequency;

  // Supuesto MVP: si no existe un calendario real de pagos, se distribuyen los flujos
  // por periodo regular. CER/dollar-linked quedan como ajuste simplificado de principal.
  return Array.from({ length: totalPeriods }, (_, index) => {
    const period = index + 1;
    const yearFraction = period / instrument.couponFrequency;
    const isLastPeriod = period === totalPeriods;
    const amortization =
      instrument.amortizationType === "amortizing"
        ? principal / totalPeriods
        : isLastPeriod
          ? principal
          : 0;

    return {
      period,
      ...(isLastPeriod ? { date: instrument.maturityDate } : {}),
      yearFraction,
      coupon: couponPerPeriod,
      amortization,
      principal,
      totalCashFlow: couponPerPeriod + amortization,
    };
  });
}
