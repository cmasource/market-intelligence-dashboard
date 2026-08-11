import type { FreshnessStatus, FxQuote, QuoteStatus } from "./types";

type FreshnessPolicy = { freshSeconds: number; warningSeconds: number };
export type RetrievalFreshnessStatus = "recent" | "delayed" | "stale";

const DEFAULT_POLICY: FreshnessPolicy = { freshSeconds: 120, warningSeconds: 300 };
const POLICIES: Record<string, FreshnessPolicy> = {
  plus: { freshSeconds: 120, warningSeconds: 600 },
  bna: { freshSeconds: 4 * 60 * 60, warningSeconds: 12 * 60 * 60 },
  belo: DEFAULT_POLICY,
  dolarapp: DEFAULT_POLICY,
  satoshitango: DEFAULT_POLICY,
  fiwind: DEFAULT_POLICY,
};

export function quoteAgeSeconds(quote: FxQuote, now = new Date()) {
  if (!quote.observedAt) return Number.POSITIVE_INFINITY;
  const observed = new Date(quote.observedAt).getTime();
  if (!Number.isFinite(observed)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((now.getTime() - observed) / 1000));
}

export function retrievalAgeSeconds(quote: FxQuote, now = new Date()) {
  const fetched = new Date(quote.fetchedAt).getTime();
  if (!Number.isFinite(fetched)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((now.getTime() - fetched) / 1000));
}

export function getRetrievalFreshnessStatus(quote: FxQuote, now = new Date()): RetrievalFreshnessStatus {
  const age = retrievalAgeSeconds(quote, now);
  if (age <= 5 * 60) return "recent";
  if (age <= 10 * 60) return "delayed";
  return "stale";
}

export function getFreshnessStatus(quote: FxQuote, now = new Date()): FreshnessStatus {
  if (["stale", "unavailable", "error"].includes(quote.status)) return "stale";
  if (!quote.observedAt) return "unverifiable";
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
