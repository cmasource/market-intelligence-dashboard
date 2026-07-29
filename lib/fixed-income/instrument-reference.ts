import type { FixedIncomeCashFlow, FixedIncomeInstrument, SpeciesType } from "./types";

const DAY_MS = 86_400_000;

function yearFraction(from: Date, to: Date) {
  return Math.max(1 / 365, (to.getTime() - from.getTime()) / DAY_MS / 365);
}

function al30CashFlows(asOf: Date): FixedIncomeCashFlow[] {
  const paymentDates = [
    "2024-07-09", "2025-01-09", "2025-07-09", "2026-01-09", "2026-07-09",
    "2027-01-09", "2027-07-09", "2028-01-09", "2028-07-09", "2029-01-09",
    "2029-07-09", "2030-01-09", "2030-07-09",
  ];
  const amortizations = [4, ...Array.from({ length: 12 }, () => 8)];
  let outstandingPrincipal = 100;
  const flows: FixedIncomeCashFlow[] = [];

  paymentDates.forEach((date, index) => {
    const paymentDate = new Date(`${date}T12:00:00Z`);
    const amortization = amortizations[index];
    if (paymentDate <= asOf) {
      outstandingPrincipal -= amortization;
      return;
    }

    const annualRate = date <= "2027-07-09" ? 0.0075 : 0.0175;
    const coupon = outstandingPrincipal * annualRate / 2;
    flows.push({
      period: flows.length + 1,
      date,
      yearFraction: yearFraction(asOf, paymentDate),
      coupon,
      amortization,
      principal: outstandingPrincipal,
      totalCashFlow: coupon + amortization,
    });
    outstandingPrincipal -= amortization;
  });

  return flows;
}

function zeroCouponFlow(asOf: Date, maturityDate: string, faceValue: number): FixedIncomeCashFlow[] {
  const maturity = new Date(`${maturityDate}T12:00:00Z`);
  if (maturity <= asOf) return [];
  return [{
    period: 1,
    date: maturityDate,
    yearFraction: yearFraction(asOf, maturity),
    coupon: 0,
    amortization: faceValue,
    principal: faceValue,
    totalCashFlow: faceValue,
  }];
}

function al30Species(symbol: string, speciesType: SpeciesType, asOf: Date): FixedIncomeInstrument {
  const isPeso = speciesType === "peso";
  const flows = al30CashFlows(asOf);
  const remainingPrincipal = flows.reduce((total, flow) => total + flow.amortization, 0);
  return {
    symbol,
    underlyingSymbol: "AL30",
    tradingSymbol: symbol,
    speciesType,
    tradingCurrency: isPeso ? "ARS" : speciesType === "dollar_cable" ? "USD_CABLE" : "USD_MEP",
    settlementCurrency: isPeso ? "ARS" : "USD",
    displayCurrency: isPeso ? "ARS" : "USD",
    quoteCurrency: isPeso ? "ARS" : "USD",
    settlementContext: isPeso ? "pesos" : speciesType === "dollar_cable" ? "dollar_cable" : "dollar_mep",
    indexationType: "none",
    marketConventionLabel: isPeso ? "Especie en pesos" : speciesType === "dollar_cable" ? "Especie dolar cable" : "Especie dolar MEP",
    marketConventionLabelEs: isPeso ? "Especie en pesos" : speciesType === "dollar_cable" ? "Especie dolar cable" : "Especie dolar MEP",
    marketConventionLabelEn: isPeso ? "Peso species" : speciesType === "dollar_cable" ? "Cable-dollar species" : "MEP-dollar species",
    name: isPeso ? "Bonar 2030" : `Bonar 2030 - ${speciesType === "dollar_cable" ? "dolar cable" : "dolar MEP"}`,
    type: "sovereign_bond",
    issuer: "Republica Argentina",
    currency: "USD",
    law: "argentina",
    amortizationType: "amortizing",
    couponType: "fixed",
    faceValue: remainingPrincipal,
    marketPrice: 0,
    annualCouponRate: 0.0075,
    couponFrequency: 2,
    issueDate: "2020-09-04",
    maturityDate: "2030-07-09",
    yearsToMaturity: yearFraction(asOf, new Date("2030-07-09T12:00:00Z")),
    accruedInterest: 0,
    sourceLabel: "Cotizacion local y terminos contractuales oficiales",
    isMock: false,
    contractualCashFlows: flows,
    analyticalReferenceSymbol: isPeso ? "AL30D" : symbol,
  };
}

function gd30CashFlows(asOf: Date): FixedIncomeCashFlow[] {
  const paymentDates = [
    "2024-07-09", "2025-01-09", "2025-07-09", "2026-01-09", "2026-07-09",
    "2027-01-09", "2027-07-09", "2028-01-09", "2028-07-09", "2029-01-09",
    "2029-07-09", "2030-01-09", "2030-07-09",
  ];
  const amortizations = [4, ...Array.from({ length: 12 }, () => 8)];
  let outstandingPrincipal = 100;
  const flows: FixedIncomeCashFlow[] = [];

  paymentDates.forEach((date, index) => {
    const paymentDate = new Date(`${date}T12:00:00Z`);
    const amortization = amortizations[index];
    if (paymentDate <= asOf) {
      outstandingPrincipal -= amortization;
      return;
    }

    const annualRate = date <= "2027-07-09" ? 0.005 : 0.0175;
    const coupon = outstandingPrincipal * annualRate / 2;
    flows.push({
      period: flows.length + 1,
      date,
      yearFraction: yearFraction(asOf, paymentDate),
      coupon,
      amortization,
      principal: outstandingPrincipal,
      totalCashFlow: coupon + amortization,
    });
    outstandingPrincipal -= amortization;
  });

  return flows;
}

function gd30Species(symbol: string, speciesType: SpeciesType, asOf: Date): FixedIncomeInstrument {
  const isPeso = speciesType === "peso";
  const flows = gd30CashFlows(asOf);
  const remainingPrincipal = flows.reduce((total, flow) => total + flow.amortization, 0);
  return {
    symbol,
    underlyingSymbol: "GD30",
    tradingSymbol: symbol,
    speciesType,
    tradingCurrency: isPeso ? "ARS" : speciesType === "dollar_cable" ? "USD_CABLE" : "USD_MEP",
    settlementCurrency: isPeso ? "ARS" : "USD",
    displayCurrency: isPeso ? "ARS" : "USD",
    quoteCurrency: isPeso ? "ARS" : "USD",
    settlementContext: isPeso ? "pesos" : speciesType === "dollar_cable" ? "dollar_cable" : "dollar_mep",
    indexationType: "none",
    marketConventionLabel: isPeso ? "Especie en pesos" : speciesType === "dollar_cable" ? "Especie dolar cable" : "Especie dolar MEP",
    marketConventionLabelEs: isPeso ? "Especie en pesos" : speciesType === "dollar_cable" ? "Especie dolar cable" : "Especie dolar MEP",
    marketConventionLabelEn: isPeso ? "Peso species" : speciesType === "dollar_cable" ? "Cable-dollar species" : "MEP-dollar species",
    name: isPeso ? "Global 2030" : `Global 2030 - ${speciesType === "dollar_cable" ? "dolar cable" : "dolar MEP"}`,
    type: "global_bond",
    issuer: "Republica Argentina",
    currency: "USD",
    law: "new_york",
    amortizationType: "amortizing",
    couponType: "fixed",
    faceValue: remainingPrincipal,
    marketPrice: 0,
    annualCouponRate: 0.005,
    couponFrequency: 2,
    issueDate: "2020-09-04",
    maturityDate: "2030-07-09",
    yearsToMaturity: yearFraction(asOf, new Date("2030-07-09T12:00:00Z")),
    accruedInterest: 0,
    sourceLabel: "Cotizacion local y terminos contractuales oficiales",
    isMock: false,
    contractualCashFlows: flows,
    analyticalReferenceSymbol: isPeso ? "GD30D" : symbol,
  };
}

function d31l6(asOf: Date): FixedIncomeInstrument {
  const maturityDate = "2026-07-31";
  return {
    symbol: "D31L6",
    underlyingSymbol: "D31L6",
    tradingSymbol: "D31L6",
    speciesType: "peso",
    tradingCurrency: "ARS_DOLLAR_LINKED",
    settlementCurrency: "ARS",
    displayCurrency: "ARS",
    quoteCurrency: "ARS",
    settlementContext: "pesos",
    indexationType: "none",
    marketConventionLabel: "LELINK dolar linked",
    marketConventionLabelEs: "LELINK dolar linked",
    marketConventionLabelEn: "Dollar-linked Treasury bill",
    name: "LELINK cero cupon 31/07/2026",
    type: "letra",
    issuer: "Tesoro Nacional",
    currency: "ARS_DOLLAR_LINKED",
    law: "argentina",
    amortizationType: "zero_coupon",
    couponType: "dollar_linked",
    faceValue: 100,
    marketPrice: 0,
    annualCouponRate: 0,
    couponFrequency: 1,
    maturityDate,
    yearsToMaturity: yearFraction(asOf, new Date(`${maturityDate}T12:00:00Z`)),
    accruedInterest: 0,
    sourceLabel: "Cotizacion local y terminos contractuales oficiales",
    isMock: false,
    contractualCashFlows: zeroCouponFlow(asOf, maturityDate, 100),
    analyticalReferenceSymbol: "D31L6",
  };
}

export function getFixedIncomeInstrumentReferences(asOf = new Date()) {
  return [
    al30Species("AL30", "peso", asOf),
    al30Species("AL30D", "dollar_mep", asOf),
    al30Species("AL30C", "dollar_cable", asOf),
    gd30Species("GD30", "peso", asOf),
    gd30Species("GD30D", "dollar_mep", asOf),
    gd30Species("GD30C", "dollar_cable", asOf),
    d31l6(asOf),
  ].filter((instrument) => instrument.contractualCashFlows?.length);
}

export function getFixedIncomeInstrumentReference(symbol: string, asOf = new Date()) {
  const normalized = symbol.trim().toUpperCase();
  return getFixedIncomeInstrumentReferences(asOf).find((instrument) => instrument.symbol === normalized) ?? null;
}
