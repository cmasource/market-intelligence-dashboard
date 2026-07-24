import { normalizeArgentinaQuote } from "./argentina-data-normalizer";
import type { ArgentinaQuote } from "./types";

type YahooChartMeta = {
  currency?: string;
  regularMarketTime?: number;
};

type YahooChartResult = {
  meta?: YahooChartMeta;
  timestamp?: number[];
  indicators?: {
    quote?: Array<{ close?: Array<number | null> }>;
  };
};

type YahooChartResponse = {
  chart?: {
    result?: YahooChartResult[] | null;
    error?: { description?: string } | null;
  };
};

function lastTwoCloses(result: YahooChartResult) {
  const closes = result.indicators?.quote?.[0]?.close ?? [];
  const valid = closes.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return { last: valid.at(-1) ?? null, previous: valid.at(-2) ?? null };
}

// ponytail: local BYMA ticker == internal symbol + ".BA" for every Argentina-classified instrument in this app's universe (verified against Yahoo for the full list before wiring this in).
export async function getArgentinaLiveQuote(symbol: string): Promise<ArgentinaQuote | null> {
  const yahooSymbol = `${symbol}.BA`;
  const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}`);
  url.searchParams.set("range", "5d");
  url.searchParams.set("interval", "1d");

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "CMA Market Intelligence market-data MVP" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;

    const data = (await response.json()) as YahooChartResponse;
    const result = data.chart?.result?.[0];
    if (!result || data.chart?.error) return null;

    const { last, previous } = lastTwoCloses(result);
    if (last === null) return null;

    const change = previous !== null ? last - previous : null;
    const changePercent = change !== null && previous ? (change / previous) * 100 : null;
    const lastUpdated = result.meta?.regularMarketTime
      ? new Date(result.meta.regularMarketTime * 1000).toISOString()
      : null;

    return normalizeArgentinaQuote({
      symbol,
      price: last,
      currency: result.meta?.currency ?? "ARS",
      change,
      changePercent,
      previousClose: previous,
      lastUpdated,
      source: "yahoo",
      sourceLabel: "Yahoo Finance (proveedor, no oficial)",
      isRealData: true,
      isFallback: false,
    });
  } catch {
    return null;
  }
}
