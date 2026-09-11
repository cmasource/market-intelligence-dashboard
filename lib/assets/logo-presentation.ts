export type AssetLogoPlacement = "default" | "list";

// Some issuer assets are delivered on a square canvas with the actual mark
// occupying only a small part of it. These list-only scales keep compact rows
// legible without changing the full logo used in asset headers.
const listScaleBySymbol: Record<string, string> = {
  ALUA: "scale-[1.3]",
  AUSO: "scale-[1.65]",
  BHIP: "scale-[1.45]",
  GCLA: "scale-[1.75]",
};

const defaultScaleBySymbol: Record<string, string> = {
  CVX: "scale-[1.8]",
  YPF: "scale-[2.6]",
  YPFD: "scale-[2.6]",
};

export function getAssetLogoScale(symbol: string, placement: AssetLogoPlacement = "default") {
  const normalized = symbol.trim().toUpperCase();
  return placement === "list"
    ? listScaleBySymbol[normalized] ?? defaultScaleBySymbol[normalized] ?? "scale-100"
    : defaultScaleBySymbol[normalized] ?? "scale-100";
}
