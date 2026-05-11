import type { AccruedInterestInputs, FixedIncomeInstrument } from "./types";

function isValidNumber(value: number) {
  return Number.isFinite(value);
}

export function calculateAccruedInterest(inputs: AccruedInterestInputs) {
  if (
    !isValidNumber(inputs.faceValue) ||
    !isValidNumber(inputs.annualCouponRate) ||
    !isValidNumber(inputs.couponFrequency) ||
    !isValidNumber(inputs.daysSinceLastCoupon) ||
    !isValidNumber(inputs.daysInCouponPeriod) ||
    inputs.faceValue <= 0 ||
    inputs.couponFrequency <= 0 ||
    inputs.daysSinceLastCoupon < 0 ||
    inputs.daysInCouponPeriod <= 0
  ) {
    return null;
  }

  // Interes corrido = cupon del periodo por la fraccion devengada del periodo actual.
  const couponPerPeriod = (inputs.faceValue * inputs.annualCouponRate) / inputs.couponFrequency;
  return couponPerPeriod * (inputs.daysSinceLastCoupon / inputs.daysInCouponPeriod);
}

export function estimateAccruedInterestFromInstrument(instrument: FixedIncomeInstrument) {
  if (typeof instrument.accruedInterest === "number" && Number.isFinite(instrument.accruedInterest)) {
    return instrument.accruedInterest;
  }

  // Limitacion MVP: el interes corrido real requiere calendario de cupones y fecha de settlement.
  return 0;
}
