import type { FreshnessStatus, FxQuote, QuoteStatus } from "./types";

type FreshnessPolicy = { freshSeconds: number; warningSeconds: number };

const DEFAULT_POLICY: FreshnessPolicy = { freshSeconds: 120, warningSeconds: 300 };
const POLICIES: Record<string, FreshnessPolicy> = {
  plus: { freshSeconds: 120, warningSeconds: 600 },
  bna: { freshSeconds: 4 * 60 * 60, warningSeconds: 12 * 60 * 60 },
  belo: DEFAULT_POLICY,
  dolarapp: DEFAULT_POLICY,
  satoshitango: DEFAULT_POLICY,
};

export function quoteAgeSeconds(quote: FxQuote, now = new Date()) {
  const observed = new Date(quote.observedAt).getTime();
  if (!Number.isFinite(observed)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((now.getTime() - observed) / 1000));
}

export function getFreshnessStatus(quote: FxQuote, now = new Date()): FreshnessStatus {
  if (["stale", "unavailable", "error"].includes(quote.status)) return "stale";
  const policy = POLICIES[quote.providerId] ?? DEFAULT_POLICY;
  const age = quoteAgeSeconds(quote, now);
  if (age > policy.warningSeconds) return "stale";
  if (quote.status === "delayed" || age > policy.freshSeconds) return "warning";
  return "fresh";
}

export function deriveQuoteStatus(providerId: string, observedAt: string, now = new Date()): QuoteStatus {
  const policy = POLICIES[providerId] ?? DEFAULT_POLICY;
  const observed = new Date(observedAt).getTime();
  if (!Number.isFinite(observed)) return "stale";
  const age = Math.max(0, Math.floor((now.getTime() - observed) / 1000));
  if (age > policy.warningSeconds) return "stale";
  if (age > policy.freshSeconds) return "delayed";
  return "live";
}
