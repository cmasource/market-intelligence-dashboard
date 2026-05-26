import type { ArgentinaSourceStatus } from "./types";

export const argentinaSourceStatuses: ArgentinaSourceStatus[] = [
  {
    source: "manual",
    enabled: true,
    mode: "manual",
    notes: "Manual validated quote loads from committed static JSON. Not real-time.",
  },
  {
    source: "byma_future",
    enabled: false,
    mode: "future",
    notes: "Future BYMA or licensed market-data integration, subject to access and commercial conditions.",
  },
  {
    source: "cnv_future",
    enabled: false,
    mode: "future",
    notes: "Future CNV filings, fundamentals and relevant facts layer. Not intended for live intraday quotes.",
  },
  {
    source: "broker_future",
    enabled: false,
    mode: "future",
    notes: "Future broker/API integrations such as IOL or PPI if authorized. No broker scraping.",
  },
  {
    source: "mock",
    enabled: true,
    mode: "mock",
    notes: "Structured mock fallback keeps Argentina flows available while official integrations are pending.",
  },
];

export function getArgentinaSourceStatuses() {
  return argentinaSourceStatuses;
}
