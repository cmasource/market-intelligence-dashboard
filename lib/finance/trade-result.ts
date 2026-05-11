import type { TradeResult, TradeResultInputs } from "@/types/finance";

function isValidNumber(value: number) {
  return Number.isFinite(value);
}

function safeDivide(numerator: number, denominator: number) {
  if (!isValidNumber(numerator) || !isValidNumber(denominator) || denominator === 0) {
    return null;
  }

  return numerator / denominator;
}

// Monto bruto de compra antes de comisiones.
export function calculateGrossPurchaseAmount(buyPrice: number, quantity: number) {
  if (!isValidNumber(buyPrice) || !isValidNumber(quantity)) return null;
  return buyPrice * quantity;
}

// Monto bruto de venta antes de comisiones e impuestos.
export function calculateGrossSaleAmount(sellPrice: number, quantity: number) {
  if (!isValidNumber(sellPrice) || !isValidNumber(quantity)) return null;
  return sellPrice * quantity;
}

// Comision expresada como tasa decimal sobre el monto operado.
export function calculateCommission(amount: number | null, commissionRate: number) {
  if (amount === null || !isValidNumber(commissionRate)) return null;
  return amount * commissionRate;
}

export function calculateTotalCost(grossPurchaseAmount: number | null, buyCommission: number | null) {
  if (grossPurchaseAmount === null || buyCommission === null) return null;
  return grossPurchaseAmount + buyCommission;
}

export function calculateNetSaleProceeds(grossSaleAmount: number | null, sellCommission: number | null, taxes = 0) {
  if (grossSaleAmount === null || sellCommission === null || !isValidNumber(taxes)) return null;
  return grossSaleAmount - sellCommission - taxes;
}

export function calculateGrossProfit(grossSaleAmount: number | null, grossPurchaseAmount: number | null) {
  if (grossSaleAmount === null || grossPurchaseAmount === null) return null;
  return grossSaleAmount - grossPurchaseAmount;
}

// Ganancia neta incorporando comisiones, impuestos y dividendos recibidos.
export function calculateNetProfit(netSaleProceeds: number | null, totalCost: number | null, dividendsReceived = 0) {
  if (netSaleProceeds === null || totalCost === null || !isValidNumber(dividendsReceived)) return null;
  return netSaleProceeds - totalCost + dividendsReceived;
}

// Retorno total en formato decimal; 0.10 equivale a 10%.
export function calculateTotalReturn(netProfit: number | null, totalCost: number | null) {
  if (netProfit === null || totalCost === null) return null;
  return safeDivide(netProfit, totalCost);
}

// Retorno anualizado asumiendo capitalizacion compuesta simple por dias de tenencia.
export function calculateAnnualizedReturn(totalReturn: number | null, holdingDays?: number) {
  if (totalReturn === null || holdingDays === undefined || holdingDays <= 0 || !isValidNumber(holdingDays)) return null;
  return (1 + totalReturn) ** (365 / holdingDays) - 1;
}

export function calculateTradeResult(inputs: TradeResultInputs): TradeResult {
  const grossPurchaseAmount = calculateGrossPurchaseAmount(inputs.buyPrice, inputs.quantity);
  const grossSaleAmount = calculateGrossSaleAmount(inputs.sellPrice, inputs.quantity);
  const buyCommission = calculateCommission(grossPurchaseAmount, inputs.buyCommissionRate);
  const sellCommission = calculateCommission(grossSaleAmount, inputs.sellCommissionRate);
  const totalCost = calculateTotalCost(grossPurchaseAmount, buyCommission);
  const netSaleProceeds = calculateNetSaleProceeds(grossSaleAmount, sellCommission, inputs.taxes ?? 0);
  const grossProfit = calculateGrossProfit(grossSaleAmount, grossPurchaseAmount);
  const netProfit = calculateNetProfit(netSaleProceeds, totalCost, inputs.dividendsReceived ?? 0);
  const totalReturn = calculateTotalReturn(netProfit, totalCost);
  const annualizedReturn = calculateAnnualizedReturn(totalReturn, inputs.holdingDays);

  return {
    grossPurchaseAmount,
    grossSaleAmount,
    buyCommission,
    sellCommission,
    totalCost,
    netSaleProceeds,
    grossProfit,
    netProfit,
    totalReturn,
    ...(inputs.holdingDays !== undefined ? { annualizedReturn } : {}),
  };
}
