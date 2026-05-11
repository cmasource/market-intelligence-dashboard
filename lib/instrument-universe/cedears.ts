export type CedearInstrument = {
  localSymbol: string;
  underlyingSymbol: string;
  underlyingName: string;
  market: "BYMA";
  localCurrency: "ARS";
  underlyingCurrency: "USD";
  ratio?: number;
  hasDollarSpecies?: boolean;
  relatedSymbols?: string[];
  status: "mock" | "future" | "real_supported";
};

// TODO: add official CEDEAR ratios from a licensed/local data source.
// TODO: add local ARS price, dollar species, underlying USD price and implied CCL.
// TODO: compare CEDEAR valuation against the underlying for arbitrage intelligence.
export const CEDEAR_INSTRUMENTS: CedearInstrument[] = [
  { localSymbol: "AAPL", underlyingSymbol: "AAPL", underlyingName: "Apple Inc.", market: "BYMA", localCurrency: "ARS", underlyingCurrency: "USD", hasDollarSpecies: true, status: "future" },
  { localSymbol: "MSFT", underlyingSymbol: "MSFT", underlyingName: "Microsoft Corporation", market: "BYMA", localCurrency: "ARS", underlyingCurrency: "USD", hasDollarSpecies: true, status: "future" },
  { localSymbol: "NVDA", underlyingSymbol: "NVDA", underlyingName: "NVIDIA Corporation", market: "BYMA", localCurrency: "ARS", underlyingCurrency: "USD", hasDollarSpecies: true, status: "future" },
  { localSymbol: "TSLA", underlyingSymbol: "TSLA", underlyingName: "Tesla Inc.", market: "BYMA", localCurrency: "ARS", underlyingCurrency: "USD", hasDollarSpecies: true, status: "future" },
  { localSymbol: "AMZN", underlyingSymbol: "AMZN", underlyingName: "Amazon.com Inc.", market: "BYMA", localCurrency: "ARS", underlyingCurrency: "USD", hasDollarSpecies: true, status: "future" },
  { localSymbol: "META", underlyingSymbol: "META", underlyingName: "Meta Platforms Inc.", market: "BYMA", localCurrency: "ARS", underlyingCurrency: "USD", hasDollarSpecies: true, status: "future" },
  { localSymbol: "GOOGL", underlyingSymbol: "GOOGL", underlyingName: "Alphabet Inc.", market: "BYMA", localCurrency: "ARS", underlyingCurrency: "USD", hasDollarSpecies: true, status: "future" },
  { localSymbol: "SPY", underlyingSymbol: "SPY", underlyingName: "SPDR S&P 500 ETF Trust", market: "BYMA", localCurrency: "ARS", underlyingCurrency: "USD", hasDollarSpecies: true, status: "future" },
  { localSymbol: "QQQ", underlyingSymbol: "QQQ", underlyingName: "Invesco QQQ Trust", market: "BYMA", localCurrency: "ARS", underlyingCurrency: "USD", hasDollarSpecies: true, status: "future" },
  { localSymbol: "KO", underlyingSymbol: "KO", underlyingName: "The Coca-Cola Company", market: "BYMA", localCurrency: "ARS", underlyingCurrency: "USD", hasDollarSpecies: true, status: "future" },
];
