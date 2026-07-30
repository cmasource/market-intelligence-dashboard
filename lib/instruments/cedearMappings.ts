type CedearUnderlying = {
  underlyingSymbol: string;
  type: "stock" | "etf";
  ratio?: number;
  exchange?: string;
  country?: string;
  currency?: string;
};

export const cedearUnderlyingSymbols: Record<string, CedearUnderlying> = {
  AAPL: { underlyingSymbol: "AAPL", type: "stock", ratio: 20 },
  MSFT: { underlyingSymbol: "MSFT", type: "stock", ratio: 30 },
  GOOGL: { underlyingSymbol: "GOOGL", type: "stock", ratio: 58 },
  AMZN: { underlyingSymbol: "AMZN", type: "stock", ratio: 144 },
  META: { underlyingSymbol: "META", type: "stock", ratio: 24 },
  NVDA: { underlyingSymbol: "NVDA", type: "stock", ratio: 24 },
  TSLA: { underlyingSymbol: "TSLA", type: "stock", ratio: 15 },
  AMD: { underlyingSymbol: "AMD", type: "stock", ratio: 10 },
  AVGO: { underlyingSymbol: "AVGO", type: "stock" },
  KO: { underlyingSymbol: "KO", type: "stock", ratio: 5 },
  PEP: { underlyingSymbol: "PEP", type: "stock", ratio: 18 },
  MCD: { underlyingSymbol: "MCD", type: "stock", ratio: 24 },
  WMT: { underlyingSymbol: "WMT", type: "stock", ratio: 30 },
  JPM: { underlyingSymbol: "JPM", type: "stock", ratio: 15 },
  BAC: { underlyingSymbol: "BAC", type: "stock", ratio: 4 },
  DIS: { underlyingSymbol: "DIS", type: "stock" },
  NFLX: { underlyingSymbol: "NFLX", type: "stock", ratio: 16 },
  MELI: { underlyingSymbol: "MELI", type: "stock", ratio: 120 },
  SPY: { underlyingSymbol: "SPY", type: "etf", ratio: 60 },
  QQQ: { underlyingSymbol: "QQQ", type: "etf", ratio: 20 },
  DIA: { underlyingSymbol: "DIA", type: "etf", ratio: 20 },
  IWM: { underlyingSymbol: "IWM", type: "etf", ratio: 10 },
  EWZ: { underlyingSymbol: "EWZ", type: "etf" },
  ARKK: { underlyingSymbol: "ARKK", type: "etf" },
  XLF: { underlyingSymbol: "XLF", type: "etf" },
  XLK: { underlyingSymbol: "XLK", type: "etf" },
  XLE: { underlyingSymbol: "XLE", type: "etf", ratio: 10 },
  INTC: { underlyingSymbol: "INTC", type: "stock", ratio: 5 },
  BABA: { underlyingSymbol: "BABA", type: "stock", ratio: 9 },
  COST: { underlyingSymbol: "COST", type: "stock", ratio: 48 },
  PG: { underlyingSymbol: "PG", type: "stock", ratio: 15 },
  JNJ: { underlyingSymbol: "JNJ", type: "stock", ratio: 15 },
  V: { underlyingSymbol: "V", type: "stock", ratio: 18 },
  MA: { underlyingSymbol: "MA", type: "stock", ratio: 33 },
  BRKB: { underlyingSymbol: "BRK-B", type: "stock", ratio: 22 },
  GLD: { underlyingSymbol: "GLD", type: "etf", ratio: 10 },
  SLV: { underlyingSymbol: "SLV", type: "etf", ratio: 10 },
  XOM: { underlyingSymbol: "XOM", type: "stock", ratio: 10 },
  CVX: { underlyingSymbol: "CVX", type: "stock", ratio: 16 },
  UNH: { underlyingSymbol: "UNH", type: "stock", ratio: 33 },
  NKE: { underlyingSymbol: "NKE", type: "stock", ratio: 12 },
  CRM: { underlyingSymbol: "CRM", type: "stock", ratio: 18 },
  ORCL: { underlyingSymbol: "ORCL", type: "stock", ratio: 3 },
  IBM: { underlyingSymbol: "IBM", type: "stock", ratio: 15 },
  VALE: { underlyingSymbol: "VALE", type: "stock", ratio: 2 },
  PBR: { underlyingSymbol: "PBR", type: "stock", ratio: 2 },

  // The local CEDEAR symbol is not always the ticker used by the origin market.
  // These aliases are kept here so every technical-analysis entry point resolves
  // to the same verified OHLCV series.
  ADGO: { underlyingSymbol: "AGRO", type: "stock" },
  ADS: { underlyingSymbol: "ADS.DE", type: "stock", exchange: "XETRA", country: "DE", currency: "EUR" },
  AKOBD: { underlyingSymbol: "AKO-B", type: "stock" },
  ALAD: { underlyingSymbol: "ALAB", type: "stock" },
  BBV: { underlyingSymbol: "BBVA", type: "stock" },
  BNG: { underlyingSymbol: "BG", type: "stock" },
  DISN: { underlyingSymbol: "DIS", type: "stock" },
  FD: { underlyingSymbol: "F", type: "stock" },
  GOGLC: { underlyingSymbol: "GOOGL", type: "stock" },
  GOGLD: { underlyingSymbol: "GOOGL", type: "stock" },
  KOFM: { underlyingSymbol: "KOF", type: "stock" },
  NAT3D: { underlyingSymbol: "NATU3.SA", type: "stock", exchange: "B3", country: "BR", currency: "BRL" },
  NOKA: { underlyingSymbol: "NOK", type: "stock" },
  OD: { underlyingSymbol: "O", type: "stock" },
  PETRD: { underlyingSymbol: "PETR3.SA", type: "stock", exchange: "B3", country: "BR", currency: "BRL" },
  PKS: { underlyingSymbol: "PKX", type: "stock" },
  SMSN: { underlyingSymbol: "SMSN.IL", type: "stock", exchange: "LSE", country: "KR", currency: "USD" },
  TRVV: { underlyingSymbol: "TRV", type: "stock" },
  TXR: { underlyingSymbol: "TX", type: "stock" },
  VAL3D: { underlyingSymbol: "VALE3.SA", type: "stock", exchange: "B3", country: "BR", currency: "BRL" },
  VD: { underlyingSymbol: "V", type: "stock" },
  WBO: { underlyingSymbol: "WB", type: "stock" },
  XROX: { underlyingSymbol: "XRX", type: "stock" },

  ABEV3: { underlyingSymbol: "ABEV3.SA", type: "stock", exchange: "B3", country: "BR", currency: "BRL" },
  BBAS3: { underlyingSymbol: "BBAS3.SA", type: "stock", exchange: "B3", country: "BR", currency: "BRL" },
  BBDC3: { underlyingSymbol: "BBDC3.SA", type: "stock", exchange: "B3", country: "BR", currency: "BRL" },
  BPA11: { underlyingSymbol: "BPAC11.SA", type: "stock", exchange: "B3", country: "BR", currency: "BRL" },
  CSNA3: { underlyingSymbol: "CSNA3.SA", type: "stock", exchange: "B3", country: "BR", currency: "BRL" },
  HAPV3: { underlyingSymbol: "HAPV3.SA", type: "stock", exchange: "B3", country: "BR", currency: "BRL" },
  ITUB3: { underlyingSymbol: "ITUB3.SA", type: "stock", exchange: "B3", country: "BR", currency: "BRL" },
  LREN3: { underlyingSymbol: "LREN3.SA", type: "stock", exchange: "B3", country: "BR", currency: "BRL" },
  MGLU3: { underlyingSymbol: "MGLU3.SA", type: "stock", exchange: "B3", country: "BR", currency: "BRL" },
  NATU3: { underlyingSymbol: "NATU3.SA", type: "stock", exchange: "B3", country: "BR", currency: "BRL" },
  PETR3: { underlyingSymbol: "PETR3.SA", type: "stock", exchange: "B3", country: "BR", currency: "BRL" },
  PRIO3: { underlyingSymbol: "PRIO3.SA", type: "stock", exchange: "B3", country: "BR", currency: "BRL" },
  RENT3: { underlyingSymbol: "RENT3.SA", type: "stock", exchange: "B3", country: "BR", currency: "BRL" },
  SBSP3: { underlyingSymbol: "SBSP3.SA", type: "stock", exchange: "B3", country: "BR", currency: "BRL" },
  SUZB3: { underlyingSymbol: "SUZB3.SA", type: "stock", exchange: "B3", country: "BR", currency: "BRL" },
  TIMS3: { underlyingSymbol: "TIMS3.SA", type: "stock", exchange: "B3", country: "BR", currency: "BRL" },
  VALE3: { underlyingSymbol: "VALE3.SA", type: "stock", exchange: "B3", country: "BR", currency: "BRL" },
  VIVT3: { underlyingSymbol: "VIVT3.SA", type: "stock", exchange: "B3", country: "BR", currency: "BRL" },
  WEGE3: { underlyingSymbol: "WEGE3.SA", type: "stock", exchange: "B3", country: "BR", currency: "BRL" },
};

export function getCedearRatio(symbol: string) {
  return cedearUnderlyingSymbols[symbol.trim().toUpperCase()]?.ratio;
}

export const cedearWarning = "El CEDEAR puede diferir del subyacente por CCL/MEP implicito, ratio, liquidez, moneda, plazo y spread.";
