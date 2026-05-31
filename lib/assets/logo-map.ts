import type { AssetType } from "@/types/asset";

export type AssetLogoMetadata = {
  symbol: string;
  label: string;
  initials: string;
  accent: "cyan" | "blue" | "violet" | "emerald" | "amber" | "rose" | "slate";
};

const knownLogos: Record<string, AssetLogoMetadata> = {
  AAPL: { symbol: "AAPL", label: "Apple", initials: "A", accent: "slate" },
  MSFT: { symbol: "MSFT", label: "Microsoft", initials: "M", accent: "blue" },
  NVDA: { symbol: "NVDA", label: "NVIDIA", initials: "NV", accent: "emerald" },
  TSLA: { symbol: "TSLA", label: "Tesla", initials: "T", accent: "rose" },
  KO: { symbol: "KO", label: "Coca-Cola", initials: "KO", accent: "rose" },
  SPY: { symbol: "SPY", label: "SPY ETF", initials: "SP", accent: "cyan" },
  QQQ: { symbol: "QQQ", label: "QQQ ETF", initials: "Q", accent: "violet" },
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
  return knownLogos[normalized] ?? {
    symbol: normalized,
    label: name ?? normalized,
    initials: initialsFromSymbol(normalized),
    accent: accentForType(type),
  };
}

