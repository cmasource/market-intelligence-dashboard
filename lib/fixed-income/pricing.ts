function isValidNumber(value: number) {
  return Number.isFinite(value);
}

export function calculateCleanPrice(dirtyPrice: number, accruedInterest: number) {
  return dirtyPrice - accruedInterest;
}

export function calculateDirtyPrice(cleanPrice: number, accruedInterest: number) {
  return cleanPrice + accruedInterest;
}

export function calculateParity(price: number, faceValue: number) {
  if (!isValidNumber(price) || !isValidNumber(faceValue) || faceValue <= 0) return null;
  // La paridad compara precio contra valor tecnico/nominal usado como base.
  return price / faceValue;
}

export function calculateCurrentYield(annualCoupon: number, marketPrice: number) {
  if (!isValidNumber(annualCoupon) || !isValidNumber(marketPrice) || marketPrice <= 0) return null;
  // Current yield usa rendimiento corriente simple, no TIR.
  return annualCoupon / marketPrice;
}

export function normalizeBondPrice(price: number, faceValue: number) {
  if (!isValidNumber(price) || !isValidNumber(faceValue) || faceValue <= 0) return null;
  return price / faceValue;
}
