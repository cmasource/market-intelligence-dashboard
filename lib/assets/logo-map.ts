import type { AssetType } from "@/types/asset";
import { assetLogoDomains, cryptoLogoIds } from "./logo-domains";

export type AssetLogoMetadata = {
  symbol: string;
  label: string;
  initials: string;
  accent: "cyan" | "blue" | "violet" | "emerald" | "amber" | "rose" | "slate";
  variant?: "apple" | "microsoft" | "tesla" | "cocaCola" | "amazon" | "etf";
  logoDomain?: string;
  cryptoLogoId?: string;
};

const knownLogos: Record<string, AssetLogoMetadata> = {
  AAPL: { symbol: "AAPL", label: "Apple", initials: "A", accent: "slate", variant: "apple" },
  MSFT: { symbol: "MSFT", label: "Microsoft", initials: "M", accent: "blue", variant: "microsoft" },
  NVDA: { symbol: "NVDA", label: "NVIDIA", initials: "NV", accent: "emerald" },
  TSLA: { symbol: "TSLA", label: "Tesla", initials: "T", accent: "rose", variant: "tesla" },
  KO: { symbol: "KO", label: "Coca-Cola", initials: "KO", accent: "rose", variant: "cocaCola" },
  AMZN: { symbol: "AMZN", label: "Amazon", initials: "A", accent: "amber", variant: "amazon" },
  GOOGL: { symbol: "GOOGL", label: "Alphabet", initials: "GO", accent: "blue" },
  META: { symbol: "META", label: "Meta", initials: "ME", accent: "blue" },
  PEP: { symbol: "PEP", label: "PepsiCo", initials: "PE", accent: "blue" },
  MCD: { symbol: "MCD", label: "McDonald's", initials: "MC", accent: "amber" },
  WMT: { symbol: "WMT", label: "Walmart", initials: "WM", accent: "blue" },
  COST: { symbol: "COST", label: "Costco", initials: "CO", accent: "blue" },
  JPM: { symbol: "JPM", label: "JPMorgan Chase", initials: "JP", accent: "blue" },
  BAC: { symbol: "BAC", label: "Bank of America", initials: "BA", accent: "blue" },
  V: { symbol: "V", label: "Visa", initials: "V", accent: "blue" },
  MA: { symbol: "MA", label: "Mastercard", initials: "MA", accent: "amber" },
  XOM: { symbol: "XOM", label: "Exxon Mobil", initials: "XO", accent: "blue" },
  CVX: { symbol: "CVX", label: "Chevron", initials: "CV", accent: "blue" },
  MELI: { symbol: "MELI", label: "MercadoLibre", initials: "ML", accent: "amber" },
  NFLX: { symbol: "NFLX", label: "Netflix", initials: "N", accent: "rose" },
  AMD: { symbol: "AMD", label: "AMD", initials: "AM", accent: "rose" },
  INTC: { symbol: "INTC", label: "Intel", initials: "IN", accent: "blue" },
  SPY: { symbol: "SPY", label: "SPY ETF", initials: "SP", accent: "cyan", variant: "etf" },
  QQQ: { symbol: "QQQ", label: "QQQ ETF", initials: "Q", accent: "violet", variant: "etf" },
  DIA: { symbol: "DIA", label: "DIA ETF", initials: "DI", accent: "cyan", variant: "etf" },
  IWM: { symbol: "IWM", label: "IWM ETF", initials: "IW", accent: "cyan", variant: "etf" },
  GLD: { symbol: "GLD", label: "GLD ETF", initials: "GL", accent: "amber", variant: "etf" },
  SLV: { symbol: "SLV", label: "SLV ETF", initials: "SL", accent: "slate", variant: "etf" },
  "BTC-USD": { symbol: "BTC-USD", label: "Bitcoin", initials: "B", accent: "amber" },
  "ETH-USD": { symbol: "ETH-USD", label: "Ethereum", initials: "E", accent: "violet" },
  GGAL: { symbol: "GGAL", label: "Grupo Financiero Galicia", initials: "GG", accent: "emerald" },
  YPFD: { symbol: "YPFD", label: "YPF", initials: "YP", accent: "blue" },
  PAMP: { symbol: "PAMP", label: "Pampa Energia", initials: "PA", accent: "emerald" },
  AL30: { symbol: "AL30", label: "AL30", initials: "30", accent: "amber" },
  AL30D: { symbol: "AL30D", label: "AL30D", initials: "30D", accent: "amber" },
  AL30C: { symbol: "AL30C", label: "AL30C", initials: "30C", accent: "amber" },
  GD30: { symbol: "GD30", label: "GD30", initials: "GD", accent: "amber" },
  GD30D: { symbol: "GD30D", label: "GD30D", initials: "GDD", accent: "amber" },
  GD30C: { symbol: "GD30C", label: "GD30C", initials: "GDC", accent: "amber" },
  TX26: { symbol: "TX26", label: "TX26", initials: "TX", accent: "emerald" },
};

function accentForType(type?: AssetType | string): AssetLogoMetadata["accent"] {
  if (!type) return "cyan";
  if (type.includes("bond") || type === "letra") return "amber";
  if (type === "crypto") return "violet";
  if (type === "cedear" || type === "argentine_equity") return "emerald";
  if (type === "etf") return "blue";
  return "cyan";
}

function initialsFromSymbol(symbol: string) {
  const clean = symbol.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  if (!clean) return "CM";
  return clean.length <= 3 ? clean : clean.slice(0, 2);
}

export function getAssetLogoMetadata(symbol: string, type?: AssetType | string, name?: string): AssetLogoMetadata {
  const normalized = symbol.toUpperCase();
  const base = knownLogos[normalized] ?? {
    symbol: normalized,
    label: name ?? normalized,
    initials: initialsFromSymbol(normalized),
    accent: accentForType(type),
  };

  return {
    ...base,
    logoDomain: assetLogoDomains[normalized],
    cryptoLogoId: cryptoLogoIds[normalized],
  };
}

