import type { FundamentalInputs, FundamentalRatios } from "@/types/finance";

function isValidNumber(value: number) {
  return Number.isFinite(value);
}

function safeDivide(numerator: number, denominator: number) {
  if (!isValidNumber(numerator) || !isValidNumber(denominator) || denominator === 0) {
    return null;
  }

  return numerator / denominator;
}

// ROE mide la rentabilidad generada sobre el patrimonio contable de la empresa.
export function calculateROE(netIncome: number, equity: number) {
  return safeDivide(netIncome, equity);
}

// ROA mide la eficiencia con la que los activos generan utilidad.
export function calculateROA(netIncome: number, totalAssets: number) {
  return safeDivide(netIncome, totalAssets);
}

// El margen EBITDA aproxima la rentabilidad operativa antes de depreciaciones, amortizaciones, intereses e impuestos.
export function calculateEBITDAMargin(ebitda: number, revenue: number) {
  return safeDivide(ebitda, revenue);
}

// EPS/BPA indica la utilidad atribuible a cada accion en circulacion.
export function calculateEPS(netIncome: number, sharesOutstanding: number) {
  return safeDivide(netIncome, sharesOutstanding);
}

// P/E compara el precio de mercado contra la utilidad por accion.
export function calculatePER(marketPrice: number, eps: number | null) {
  if (eps === null) return null;
  return safeDivide(marketPrice, eps);
}

// Valor libros por accion muestra el patrimonio contable asignable a cada accion.
export function calculateBookValuePerShare(bookValue: number, sharesOutstanding: number) {
  return safeDivide(bookValue, sharesOutstanding);
}

// P/B compara el precio de mercado contra el valor libros por accion.
export function calculatePriceToBook(marketPrice: number, bookValuePerShare: number | null) {
  if (bookValuePerShare === null) return null;
  return safeDivide(marketPrice, bookValuePerShare);
}

// Dividend yield mide el retorno por dividendos respecto del precio de mercado.
export function calculateDividendYield(dividendsPerShare: number | undefined, marketPrice: number) {
  if (dividendsPerShare === undefined) return null;
  return safeDivide(dividendsPerShare, marketPrice);
}

export function calculateFundamentalRatios(inputs: FundamentalInputs): FundamentalRatios {
  const eps = calculateEPS(inputs.netIncome, inputs.sharesOutstanding);
  const bookValuePerShare = calculateBookValuePerShare(inputs.bookValue, inputs.sharesOutstanding);
  const dividendYield =
    inputs.dividendsPerShare === undefined
      ? undefined
      : calculateDividendYield(inputs.dividendsPerShare, inputs.marketPrice);

  return {
    roe: calculateROE(inputs.netIncome, inputs.equity),
    roa: calculateROA(inputs.netIncome, inputs.totalAssets),
    ebitdaMargin: calculateEBITDAMargin(inputs.ebitda, inputs.revenue),
    eps,
    peRatio: calculatePER(inputs.marketPrice, eps),
    bookValuePerShare,
    priceToBook: calculatePriceToBook(inputs.marketPrice, bookValuePerShare),
    ...(dividendYield !== undefined ? { dividendYield } : {}),
  };
}
