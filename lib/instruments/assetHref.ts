export function getAssetHref(symbol: string, instrumentId?: string | null) {
  const pathname = `/asset/${encodeURIComponent(symbol)}`;
  if (!instrumentId) return pathname;
  return `${pathname}?instrumentId=${encodeURIComponent(instrumentId)}`;
}
