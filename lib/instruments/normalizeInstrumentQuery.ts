export function normalizeInstrumentQuery(query: string) {
  return query
    .trim()
    .toUpperCase()
    .replace(/^NASDAQ:/, "")
    .replace(/^NYSE:/, "")
    .replace(/^AMEX:/, "")
    .replace(/^BCBA:/, "")
    .replace(/\s+/g, " ");
}
