import type { ArgentinaSourceStatus } from "./types";
import { getPpiRuntimeStatus } from "@/lib/providers/ppi-provider";

export function getArgentinaSourceStatuses(): ArgentinaSourceStatus[] {
  const ppiStatus = getPpiRuntimeStatus();

  return [
    {
      source: "ppi",
      enabled: ppiStatus.configured,
      mode: "live",
      notes: ppiStatus.configured
        ? `Portfolio Personal Inversiones API in read-only mode for local market quotes. Environment: ${ppiStatus.environment}.`
        : "Portfolio Personal Inversiones API is not configured for the selected environment.",
      providerEnvironment: ppiStatus.environment,
      baseUrl: ppiStatus.baseUrl,
      missingVariables: ppiStatus.missingVariables,
      lastError: ppiStatus.lastError,
    },
    {
      source: "data912",
      enabled: true,
      mode: "live",
      notes: "Public local market quote feed used for Argentina equities, CEDEARs and bonds when broker/BYMA APIs are unavailable.",
    },
    {
      source: "yahoo",
      enabled: true,
      mode: "live",
      notes: "Live Yahoo Finance-compatible quote for the BYMA-listed symbol (SYMBOL.BA). Best-effort, unofficial, delayed.",
    },
    {
      source: "manual",
      enabled: true,
      mode: "manual",
      notes: "Manual validated quote loads from committed static JSON. Used only when the live quote is unavailable.",
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
}
