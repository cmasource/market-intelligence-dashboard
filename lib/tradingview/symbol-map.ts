export type TradingViewSymbolMapping = {
  internalSymbol: string;
  tradingViewSymbol: string;
  verified: boolean;
};

const verifiedTradingViewSymbols: Record<string, string> = {
  AAPL: "NASDAQ:AAPL",
  MSFT: "NASDAQ:MSFT",
  NVDA: "NASDAQ:NVDA",
  TSLA: "NASDAQ:TSLA",
  AMZN: "NASDAQ:AMZN",
  META: "NASDAQ:META",
  GOOGL: "NASDAQ:GOOGL",
  KO: "NYSE:KO",
  MELI: "NASDAQ:MELI",
  GGAL: "BCBA:GGAL",
  YPFD: "BCBA:YPFD",
  PAMP: "BCBA:PAMP",
  TGSU2: "BCBA:TGSU2",
  TRAN: "BCBA:TRAN",
  "BTC-USD": "BINANCE:BTCUSDT",
  "ETH-USD": "BINANCE:ETHUSDT",
};

export function getTradingViewSymbol(symbol: string): TradingViewSymbolMapping {
  const internalSymbol = symbol.trim().toUpperCase();
  const tradingViewSymbol = verifiedTradingViewSymbols[internalSymbol];

  if (tradingViewSymbol) {
    return {
      internalSymbol,
      tradingViewSymbol,
      verified: true,
    };
  }

  return {
    internalSymbol,
    tradingViewSymbol: internalSymbol,
    verified: false,
  };
}
