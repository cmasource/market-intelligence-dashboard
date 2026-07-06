export type UnderlyingMapping = {
  internalSymbol: string;
  underlyingSymbol: string;
  verified: boolean;
  reason: string;
};

const verifiedUnderlyingSymbols: Record<string, Omit<UnderlyingMapping, "internalSymbol">> = {
  AAPL: { underlyingSymbol: "AAPL", verified: true, reason: "Primary listed or CEDEAR underlying." },
  MSFT: { underlyingSymbol: "MSFT", verified: true, reason: "Primary listed or CEDEAR underlying." },
  NVDA: { underlyingSymbol: "NVDA", verified: true, reason: "Primary listed or CEDEAR underlying." },
  AMZN: { underlyingSymbol: "AMZN", verified: true, reason: "Primary listed or CEDEAR underlying." },
  META: { underlyingSymbol: "META", verified: true, reason: "Primary listed or CEDEAR underlying." },
  GOOGL: { underlyingSymbol: "GOOGL", verified: true, reason: "Primary listed or CEDEAR underlying." },
  TSLA: { underlyingSymbol: "TSLA", verified: true, reason: "Primary listed or CEDEAR underlying." },
  NFLX: { underlyingSymbol: "NFLX", verified: true, reason: "Primary listed or CEDEAR underlying." },
  AMD: { underlyingSymbol: "AMD", verified: true, reason: "Primary listed or CEDEAR underlying." },
  INTC: { underlyingSymbol: "INTC", verified: true, reason: "Primary listed or CEDEAR underlying." },
  JPM: { underlyingSymbol: "JPM", verified: true, reason: "Primary listed or CEDEAR underlying." },
  BAC: { underlyingSymbol: "BAC", verified: true, reason: "Primary listed or CEDEAR underlying." },
  KO: { underlyingSymbol: "KO", verified: true, reason: "Primary listed or CEDEAR underlying." },
  PEP: { underlyingSymbol: "PEP", verified: true, reason: "Primary listed or CEDEAR underlying." },
  WMT: { underlyingSymbol: "WMT", verified: true, reason: "Primary listed or CEDEAR underlying." },
  DIS: { underlyingSymbol: "DIS", verified: true, reason: "Primary listed or CEDEAR underlying." },
  V: { underlyingSymbol: "V", verified: true, reason: "Primary listed or CEDEAR underlying." },
  MA: { underlyingSymbol: "MA", verified: true, reason: "Primary listed or CEDEAR underlying." },
  XOM: { underlyingSymbol: "XOM", verified: true, reason: "Primary listed or CEDEAR underlying." },
  CVX: { underlyingSymbol: "CVX", verified: true, reason: "Primary listed or CEDEAR underlying." },
  UNH: { underlyingSymbol: "UNH", verified: true, reason: "Primary listed equity." },
  JNJ: { underlyingSymbol: "JNJ", verified: true, reason: "Primary listed or CEDEAR underlying." },
  PG: { underlyingSymbol: "PG", verified: true, reason: "Primary listed or CEDEAR underlying." },
  COST: { underlyingSymbol: "COST", verified: true, reason: "Primary listed or CEDEAR underlying." },
  MCD: { underlyingSymbol: "MCD", verified: true, reason: "Primary listed or CEDEAR underlying." },
  NKE: { underlyingSymbol: "NKE", verified: true, reason: "Primary listed equity." },
  CRM: { underlyingSymbol: "CRM", verified: true, reason: "Primary listed equity." },
  ORCL: { underlyingSymbol: "ORCL", verified: true, reason: "Primary listed equity." },
  IBM: { underlyingSymbol: "IBM", verified: true, reason: "Primary listed equity." },
  MELI: { underlyingSymbol: "MELI", verified: true, reason: "Primary listed or CEDEAR underlying." },
  GGAL: { underlyingSymbol: "GGAL", verified: true, reason: "Argentine ADR with provider fundamentals where available." },
  YPFD: { underlyingSymbol: "YPF", verified: true, reason: "Local ticker mapped to NYSE ADR fundamentals." },
  YPF: { underlyingSymbol: "YPF", verified: true, reason: "NYSE ADR fundamentals." },
  PAMP: { underlyingSymbol: "PAM", verified: true, reason: "Local ticker mapped to NYSE ADR fundamentals." },
  PAM: { underlyingSymbol: "PAM", verified: true, reason: "NYSE ADR fundamentals." },
  TGSU2: { underlyingSymbol: "TGS", verified: true, reason: "Local ticker mapped to NYSE ADR fundamentals." },
  TGS: { underlyingSymbol: "TGS", verified: true, reason: "NYSE ADR fundamentals." },
  BMA: { underlyingSymbol: "BMA", verified: true, reason: "NYSE ADR fundamentals." },
  BBAR: { underlyingSymbol: "BBAR", verified: true, reason: "NYSE ADR fundamentals." },
  SUPV: { underlyingSymbol: "SUPV", verified: true, reason: "NYSE ADR fundamentals." },
  LOMA: { underlyingSymbol: "LOMA", verified: true, reason: "NYSE ADR fundamentals." },
  CEPU: { underlyingSymbol: "CEPU", verified: true, reason: "NYSE ADR fundamentals." },
  DESP: { underlyingSymbol: "DESP", verified: true, reason: "NYSE ADR fundamentals." },
  GLOB: { underlyingSymbol: "GLOB", verified: true, reason: "NYSE fundamentals." },
  TECO2: { underlyingSymbol: "TEO", verified: true, reason: "Local ticker mapped to ADR fundamentals." },
};

export function normalizeInstrumentSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

export function getUnderlyingMapping(symbol: string): UnderlyingMapping {
  const internalSymbol = normalizeInstrumentSymbol(symbol);
  const mapping = verifiedUnderlyingSymbols[internalSymbol];

  if (mapping) return { internalSymbol, ...mapping };

  return {
    internalSymbol,
    underlyingSymbol: internalSymbol,
    verified: false,
    reason: "No verified underlying mapping configured.",
  };
}

