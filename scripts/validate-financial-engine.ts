const rootUrl = new URL("../", import.meta.url);

async function importModule(path: string): Promise<unknown> {
  return import(new URL(path, rootUrl).href);
}

const fundamentals = (await importModule("lib/finance/fundamentals.ts")) as typeof import("../lib/finance/fundamentals");
const bonds = (await importModule("lib/finance/bonds.ts")) as typeof import("../lib/finance/bonds");
const capm = (await importModule("lib/finance/capm.ts")) as typeof import("../lib/finance/capm");
const tradeResult = (await importModule("lib/finance/trade-result.ts")) as typeof import("../lib/finance/trade-result");
const technical = (await importModule("lib/finance/technical.ts")) as typeof import("../lib/finance/technical");
const interpretation = (await importModule("lib/finance/interpretation.ts")) as typeof import("../lib/finance/interpretation");
const fixedIncomeAccruedInterest = (await importModule("lib/fixed-income/accrued-interest.ts")) as typeof import("../lib/fixed-income/accrued-interest");
const fixedIncomeCashFlows = (await importModule("lib/fixed-income/cashflows.ts")) as typeof import("../lib/fixed-income/cashflows");
const fixedIncomeConvexity = (await importModule("lib/fixed-income/convexity.ts")) as typeof import("../lib/fixed-income/convexity");
const fixedIncomeDuration = (await importModule("lib/fixed-income/duration.ts")) as typeof import("../lib/fixed-income/duration");
const fixedIncomePricing = (await importModule("lib/fixed-income/pricing.ts")) as typeof import("../lib/fixed-income/pricing");
const fixedIncomeYield = (await importModule("lib/fixed-income/yield.ts")) as typeof import("../lib/fixed-income/yield");

let failures = 0;

function formatValue(value: unknown) {
  return typeof value === "number" ? value.toPrecision(12) : JSON.stringify(value);
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
    return;
  }

  console.log(`PASS: ${message}`);
}

function approxEqual(actual: unknown, expected: number, tolerance: number, message: string) {
  assert(
    typeof actual === "number" && Math.abs(actual - expected) <= tolerance,
    `${message} expected ${formatValue(expected)}, received ${formatValue(actual)}`,
  );
}

function assertNull(value: unknown, message: string) {
  assert(value === null, `${message} expected null, received ${formatValue(value)}`);
}

function assertArray(value: unknown, message: string) {
  assert(Array.isArray(value), `${message} expected an array`);
}

const fundamentalRatios = fundamentals.calculateFundamentalRatios({
  netIncome: 100,
  equity: 500,
  totalAssets: 1000,
  revenue: 2000,
  ebitda: 400,
  sharesOutstanding: 50,
  marketPrice: 30,
  bookValue: 500,
  dividendsPerShare: 1.5,
});

approxEqual(fundamentalRatios.roe, 0.2, 0.000001, "ROE = netIncome / equity");
approxEqual(fundamentalRatios.roa, 0.1, 0.000001, "ROA = netIncome / totalAssets");
approxEqual(fundamentalRatios.ebitdaMargin, 0.2, 0.000001, "EBITDA margin = ebitda / revenue");
approxEqual(fundamentalRatios.eps, 2, 0.000001, "EPS = netIncome / sharesOutstanding");
approxEqual(fundamentalRatios.peRatio, 15, 0.000001, "P/E = marketPrice / EPS");
approxEqual(fundamentalRatios.bookValuePerShare, 10, 0.000001, "Book value per share = bookValue / sharesOutstanding");
approxEqual(fundamentalRatios.priceToBook, 3, 0.000001, "P/B = marketPrice / bookValuePerShare");
approxEqual(fundamentalRatios.dividendYield, 0.05, 0.000001, "Dividend yield = dividendsPerShare / marketPrice");

const capmResult = capm.calculateCAPMExpectedReturn({
  riskFreeRate: 0.05,
  marketReturn: 0.12,
  beta: 1.2,
});

approxEqual(capmResult.marketRiskPremium, 0.07, 0.000001, "Market risk premium = marketReturn - riskFreeRate");
approxEqual(capmResult.expectedReturn, 0.134, 0.000001, "CAPM expected return = riskFreeRate + beta * marketRiskPremium");
approxEqual(
  capm.calculateBeta({
    assetReturns: [0.02, 0.04, -0.01, 0.03],
    marketReturns: [0.01, 0.03, -0.02, 0.02],
  }),
  1,
  0.000001,
  "Beta = covariance(assetReturns, marketReturns) / variance(marketReturns)",
);

const trade = tradeResult.calculateTradeResult({
  buyPrice: 100,
  sellPrice: 120,
  quantity: 10,
  buyCommissionRate: 0.01,
  sellCommissionRate: 0.01,
  dividendsReceived: 20,
  holdingDays: 365,
  taxes: 0,
});

approxEqual(trade.grossPurchaseAmount, 1000, 0.000001, "Gross purchase amount = buyPrice * quantity");
approxEqual(trade.grossSaleAmount, 1200, 0.000001, "Gross sale amount = sellPrice * quantity");
approxEqual(trade.buyCommission, 10, 0.000001, "Buy commission = grossPurchaseAmount * buyCommissionRate");
approxEqual(trade.sellCommission, 12, 0.000001, "Sell commission = grossSaleAmount * sellCommissionRate");
approxEqual(trade.totalCost, 1010, 0.000001, "Total cost = grossPurchaseAmount + buyCommission");
approxEqual(trade.netSaleProceeds, 1188, 0.000001, "Net sale proceeds = grossSaleAmount - sellCommission - taxes");
approxEqual(trade.grossProfit, 200, 0.000001, "Gross profit = grossSaleAmount - grossPurchaseAmount");
approxEqual(trade.netProfit, 198, 0.000001, "Net profit = netSaleProceeds - totalCost + dividendsReceived");
approxEqual(trade.totalReturn, 0.19603960396039605, 0.000001, "Total return = netProfit / totalCost");
approxEqual(trade.annualizedReturn, 0.19603960396039605, 0.000001, "Annualized return matches total return for 365 holding days");

const bondInputs = {
  faceValue: 1000,
  marketPrice: 950,
  annualCouponRate: 0.08,
  yearsToMaturity: 5,
  paymentsPerYear: 1,
};
const bond = bonds.calculateBondAnalytics(bondInputs);

approxEqual(bond.annualCoupon, 80, 0.000001, "Annual coupon = faceValue * annualCouponRate");
approxEqual(bond.couponPerPeriod, 80, 0.000001, "Coupon per period = annualCoupon / paymentsPerYear");
approxEqual(bond.totalPeriods, 5, 0.000001, "Total periods = yearsToMaturity * paymentsPerYear");
approxEqual(bond.currentYield, 0.08421052631578947, 0.000001, "Current yield = annualCoupon / marketPrice");
approxEqual(bond.parity, 0.95, 0.000001, "Parity = marketPrice / faceValue");
assert(bond.cashFlows.length === 5, "Bullet bond cash flow length matches total periods");
approxEqual(bond.cashFlows.at(-1)?.totalCashFlow, 1080, 0.000001, "Last bullet bond cash flow includes coupon plus face value");
assert(typeof bond.estimatedYTM === "number" && bond.estimatedYTM > 0.08, "Estimated YTM is above coupon rate when price is below par");
assert(
  typeof bond.macaulayDuration === "number" && bond.macaulayDuration > 0 && bond.macaulayDuration <= 5,
  "Macaulay duration is positive and no greater than maturity for this bullet bond",
);
assert(
  typeof bond.modifiedDuration === "number" &&
    typeof bond.macaulayDuration === "number" &&
    bond.modifiedDuration > 0 &&
    bond.modifiedDuration < bond.macaulayDuration,
  "Modified duration is positive and lower than Macaulay duration",
);

const fixedIncomeInstrument = {
  symbol: "TEST",
  underlyingSymbol: "TEST",
  tradingSymbol: "TEST",
  speciesType: "peso" as const,
  tradingCurrency: "USD" as const,
  settlementCurrency: "USD" as const,
  displayCurrency: "USD" as const,
  marketConventionLabel: "Validation species",
  name: "Validation Bond",
  type: "sovereign_bond" as const,
  issuer: "Validation Issuer",
  currency: "USD" as const,
  law: "argentina" as const,
  amortizationType: "bullet" as const,
  couponType: "fixed" as const,
  faceValue: 100,
  marketPrice: 95,
  annualCouponRate: 0.08,
  couponFrequency: 2,
  maturityDate: "2031-01-01",
  yearsToMaturity: 5,
  sourceLabel: "Validation mock data",
  isMock: true,
};
const fixedCashFlows = fixedIncomeCashFlows.buildFixedIncomeCashFlows(fixedIncomeInstrument);
const fixedYTM = fixedIncomeYield.estimateFixedIncomeYTM(
  fixedCashFlows,
  fixedIncomeInstrument.marketPrice,
  fixedIncomeInstrument.couponFrequency,
);
const fixedMacaulayDuration =
  fixedYTM === null
    ? null
    : fixedIncomeDuration.calculateMacaulayDurationFromCashFlows(
        fixedCashFlows,
        fixedYTM,
        fixedIncomeInstrument.couponFrequency,
      );
const fixedModifiedDuration =
  fixedYTM === null || fixedMacaulayDuration === null
    ? null
    : fixedIncomeDuration.calculateModifiedDuration(
        fixedMacaulayDuration,
        fixedYTM,
        fixedIncomeInstrument.couponFrequency,
      );
const fixedConvexity =
  fixedYTM === null
    ? null
    : fixedIncomeConvexity.calculateConvexity(
        fixedCashFlows,
        fixedYTM,
        fixedIncomeInstrument.marketPrice,
        fixedIncomeInstrument.couponFrequency,
      );

approxEqual(
  fixedIncomeAccruedInterest.calculateAccruedInterest({
    faceValue: 100,
    annualCouponRate: 0.08,
    couponFrequency: 2,
    daysSinceLastCoupon: 45,
    daysInCouponPeriod: 180,
  }),
  1,
  0.000001,
  "Accrued interest = coupon per period * elapsed coupon-period fraction",
);
approxEqual(fixedIncomePricing.calculateCleanPrice(96, 1), 95, 0.000001, "Clean price = dirty price - accrued interest");
approxEqual(fixedIncomePricing.calculateDirtyPrice(95, 1), 96, 0.000001, "Dirty price = clean price + accrued interest");
approxEqual(fixedIncomePricing.calculateParity(95, 100), 0.95, 0.000001, "Fixed income parity = price / face value");
assert(fixedCashFlows.length === 10, "Fixed income cash flows match years to maturity * coupon frequency");
approxEqual(fixedCashFlows[0]?.coupon, 4, 0.000001, "Fixed income coupon per period = 4");
approxEqual(fixedCashFlows.at(-1)?.totalCashFlow, 104, 0.000001, "Final fixed income cash flow includes coupon plus principal");
assert(typeof fixedYTM === "number" && fixedYTM > 0.08, "Fixed income YTM is above coupon rate when price is below par");
assert(typeof fixedMacaulayDuration === "number" && fixedMacaulayDuration > 0, "Fixed income Macaulay duration is positive");
assert(
  typeof fixedModifiedDuration === "number" &&
    typeof fixedMacaulayDuration === "number" &&
    fixedModifiedDuration > 0 &&
    fixedModifiedDuration < fixedMacaulayDuration,
  "Fixed income modified duration is positive and lower than Macaulay duration",
);
assert(typeof fixedConvexity === "number" && fixedConvexity > 0, "Fixed income convexity is positive when calculable");

const prices = [100, 102, 101, 105, 107, 106, 108, 110, 111, 115, 117, 116, 118, 120, 122];
const simpleReturns = technical.calculateSimpleReturns(prices);
const sma5 = technical.calculateSMA(prices, 5);
const ema5 = technical.calculateEMA(prices, 5);
const rsi14 = technical.calculateRSI(prices, 14);
const macd = technical.calculateMACD(prices);

assert(simpleReturns.length === prices.length, "Simple returns are price-aligned with first value null");
assert(simpleReturns[0] === null, "Simple returns first aligned value is null");
approxEqual(simpleReturns[1], 0.02, 0.000001, "Simple returns compute current / previous - 1");
assert(sma5.slice(0, 4).every((value) => value === null), "SMA returns nulls before enough data");
approxEqual(sma5[4], 103, 0.000001, "SMA period 5 first average is valid");
assert(ema5.some((value) => typeof value === "number"), "EMA returns numeric values after enough data");
assert(
  rsi14.every((value) => value === null || (typeof value === "number" && value >= 0 && value <= 100)),
  "RSI values are between 0 and 100 when available",
);
assertArray(macd.macdLine, "MACD line");
assertArray(macd.signalLine, "MACD signal line");
assertArray(macd.histogram, "MACD histogram");
assert(macd.macdLine.length === prices.length, "MACD line is aligned to input prices");
assert(macd.signalLine.length === prices.length, "MACD signal line is aligned to input prices");
assert(macd.histogram.length === prices.length, "MACD histogram is aligned to input prices");

assertNull(fundamentals.calculateROE(100, 0), "ROE handles zero equity safely");
assertNull(fundamentals.calculateEBITDAMargin(400, 0), "EBITDA margin handles zero revenue safely");
assertNull(fundamentals.calculateEPS(100, 0), "EPS handles zero shares outstanding safely");
assertNull(fundamentals.calculateDividendYield(1.5, 0), "Dividend yield handles zero market price safely");
assertNull(capm.calculateBeta({ assetReturns: [], marketReturns: [] }), "Beta handles empty return arrays safely");
assert(technical.calculateSimpleReturns([]).length === 0, "Simple returns handles empty arrays safely");
assert(technical.calculateSMA([], 5).length === 0, "SMA handles empty arrays safely");
assert(technical.calculateEMA([], 5).length === 0, "EMA handles empty arrays safely");
assert(technical.calculateRSI([], 14).length === 0, "RSI handles empty arrays safely");
assert(technical.calculateMACD([]).macdLine.length === 0, "MACD handles empty arrays safely");
assert(interpretation.interpretROE(null).tone === "neutral", "Interpretation helpers handle null metrics safely");

if (failures > 0) {
  console.error(`\nFinancial engine validation failed with ${failures} failure(s).`);
  process.exit(1);
}

console.log("\nFinancial engine validation passed.");
