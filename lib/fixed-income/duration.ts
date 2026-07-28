import type { FixedIncomeCashFlow } from "./types";

export function calculateMacaulayDurationFromCashFlows(
  cashFlows: FixedIncomeCashFlow[],
  annualYield: number,
  paymentsPerYear: number,
) {
  if (cashFlows.length === 0 || !Number.isFinite(annualYield) || paymentsPerYear <= 0) return null;

  if (annualYield <= -1) return null;

  let presentValueTotal = 0;
  let weightedTimeTotal = 0;

  for (const cashFlow of cashFlows) {
    const presentValue = cashFlow.totalCashFlow / (1 + annualYield) ** cashFlow.yearFraction;
    const timeInYears = cashFlow.yearFraction;

    presentValueTotal += presentValue;
    weightedTimeTotal += timeInYears * presentValue;
  }

  // Duration Macaulay mide el plazo promedio ponderado de recupero de flujos descontados.
  return presentValueTotal === 0 ? null : weightedTimeTotal / presentValueTotal;
}

export function calculateModifiedDuration(
  macaulayDuration: number,
  annualYield: number,
  paymentsPerYear: number,
) {
  if (!Number.isFinite(macaulayDuration) || !Number.isFinite(annualYield) || paymentsPerYear <= 0) return null;
  const denominator = 1 + annualYield;
  if (denominator <= 0) return null;

  // Duration modificada aproxima sensibilidad porcentual del precio ante cambios de tasa.
  return macaulayDuration / denominator;
}
