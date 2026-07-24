import { buildAnalyticsForInstrument } from "./fixed-income-service";
import type { BondComparisonItem, FixedIncomeInstrument } from "./types";

export function buildBondComparisonItems(instruments: FixedIncomeInstrument[]): BondComparisonItem[] {
  return instruments.map((instrument) => {
    const analytics = buildAnalyticsForInstrument(instrument);

    return {
      symbol: instrument.symbol,
      underlyingSymbol: instrument.underlyingSymbol,
      speciesType: instrument.speciesType,
      tradingCurrency: instrument.tradingCurrency,
      displayCurrency: instrument.displayCurrency,
      quoteCurrency: instrument.quoteCurrency,
      settlementContext: instrument.settlementContext,
      indexationType: instrument.indexationType,
      name: instrument.name,
      price: instrument.marketDisplayPrice ?? analytics.cleanPrice ?? instrument.marketPrice,
      analyticalPrice: instrument.analyticalPrice ?? instrument.marketPrice,
      parity: analytics.parity,
      estimatedYTM: analytics.estimatedYTM,
      duration: analytics.macaulayDuration,
      modifiedDuration: analytics.modifiedDuration,
      convexity: analytics.convexity,
      currency: instrument.currency,
      law: instrument.law,
      riskLevel: analytics.risk.overallRisk,
      sourceLabel: instrument.sourceLabel,
      isMock: instrument.isMock,
    };
  });
}

export function rankByYTM(items: BondComparisonItem[]) {
  return [...items].sort((left, right) => (right.estimatedYTM ?? -Infinity) - (left.estimatedYTM ?? -Infinity));
}

export function rankByDuration(items: BondComparisonItem[]) {
  return [...items].sort((left, right) => (right.duration ?? -Infinity) - (left.duration ?? -Infinity));
}

export function rankByParity(items: BondComparisonItem[]) {
  return [...items].sort((left, right) => (right.parity ?? -Infinity) - (left.parity ?? -Infinity));
}
