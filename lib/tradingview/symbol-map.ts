export type TradingViewSymbolMapping = {
  internalSymbol: string;
  tradingViewSymbol: string;
  verified: boolean;
};

const verifiedTradingViewSymbols: Record<string, string> = {
  AAPL: "NASDAQ:AAPL",
  MSFT: "NASDAQ:MSFT",
  NVDA: "NASDAQ:NVDA",
  AMD: "NASDAQ:AMD",
  INTC: "NASDAQ:INTC",
  TSLA: "NASDAQ:TSLA",
  AMZN: "NASDAQ:AMZN",
  META: "NASDAQ:META",
  GOOGL: "NASDAQ:GOOGL",
  NFLX: "NASDAQ:NFLX",
  JPM: "NYSE:JPM",
  BAC: "NYSE:BAC",
  KO: "NYSE:KO",
  PEP: "NASDAQ:PEP",
  WMT: "NYSE:WMT",
  DIS: "NYSE:DIS",
  V: "NYSE:V",
  MA: "NYSE:MA",
  XOM: "NYSE:XOM",
  CVX: "NYSE:CVX",
  UNH: "NYSE:UNH",
  JNJ: "NYSE:JNJ",
  PG: "NYSE:PG",
  COST: "NASDAQ:COST",
  MCD: "NYSE:MCD",
  NKE: "NYSE:NKE",
  CRM: "NYSE:CRM",
  ORCL: "NYSE:ORCL",
  IBM: "NYSE:IBM",
  MELI: "NASDAQ:MELI",
  SPY: "AMEX:SPY",
  QQQ: "NASDAQ:QQQ",
  DIA: "AMEX:DIA",
  IWM: "AMEX:IWM",
  GLD: "AMEX:GLD",
  SLV: "AMEX:SLV",
  TLT: "NASDAQ:TLT",
  HYG: "AMEX:HYG",
  VOO: "AMEX:VOO",
  VTI: "AMEX:VTI",
  GGAL: "BCBA:GGAL",
  YPFD: "BCBA:YPFD",
  PAMP: "BCBA:PAMP",
  TGSU2: "BCBA:TGSU2",
  TRAN: "BCBA:TRAN",
  BMA: "BCBA:BMA",
  BBAR: "BCBA:BBAR",
  SUPV: "BCBA:SUPV",
  LOMA: "BCBA:LOMA",
  CEPU: "BCBA:CEPU",
  TECO2: "BCBA:TECO2",
  "BTC-USD": "BINANCE:BTCUSDT",
  "ETH-USD": "BINANCE:ETHUSDT",
  "SOL-USD": "BINANCE:SOLUSDT",
  "BNB-USD": "BINANCE:BNBUSDT",
  "XRP-USD": "BINANCE:XRPUSDT",
  "ADA-USD": "BINANCE:ADAUSDT",
  "DOGE-USD": "BINANCE:DOGEUSDT",
  "AVAX-USD": "BINANCE:AVAXUSDT",
  "LINK-USD": "BINANCE:LINKUSDT",
  "DOT-USD": "BINANCE:DOTUSDT",
  "MATIC-USD": "BINANCE:MATICUSDT",
  "POL-USD": "BINANCE:POLUSDT",
  "LTC-USD": "BINANCE:LTCUSDT",
  "BCH-USD": "BINANCE:BCHUSDT",
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
