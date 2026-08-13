type MarketIndexSnapshot = {
  regularMarketPrice?: number;
  regularMarketTime?: number;
  currency?: string;
  timestamps?: number[];
  closes?: Array<number | null>;
};

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function normalizeMarketIndexSnapshot(snapshot: MarketIndexSnapshot) {
  const value = finite(snapshot.regularMarketPrice) ? snapshot.regularMarketPrice : null;
  const observations = (snapshot.timestamps ?? [])
    .map((timestamp, index) => ({ timestamp, close: snapshot.closes?.[index] }))
    .filter((item): item is { timestamp: number; close: number } => finite(item.timestamp) && finite(item.close))
    .sort((left, right) => left.timestamp - right.timestamp);

  const currentTimestamp = finite(snapshot.regularMarketTime)
    ? snapshot.regularMarketTime
    : observations.at(-1)?.timestamp ?? null;
  // The current daily candle is timestamped at session open while its close is live.
  // Therefore the prior session is always the penultimate valid daily observation.
  const previousClose = observations.at(-2)?.close ?? null;
  const changePercent = value !== null && previousClose !== null && previousClose > 0
    ? ((value - previousClose) / previousClose) * 100
    : null;

  return {
    value,
    previousClose,
    changePercent,
    currency: snapshot.currency ?? "",
    updatedAt: currentTimestamp === null ? null : new Date(currentTimestamp * 1000).toISOString(),
  };
}
