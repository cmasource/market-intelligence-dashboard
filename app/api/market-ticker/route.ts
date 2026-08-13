import { getArgentinaDollarReferences } from "@/lib/market-data/argentina-references";
import { normalizeMarketIndexSnapshot } from "@/lib/market-data/market-index-normalizer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type TickerItem = {
  id: string;
  label: string;
  value: number | null;
  changePercent: number | null;
  currency: string;
  source: string;
  updatedAt: string | null;
  status: "ok" | "unavailable";
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        regularMarketTime?: number;
        currency?: string;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{ close?: Array<number | null> }>;
      };
    }>;
  };
};

const yahooIndices = [
  { id: "sp500", label: "S&P 500", symbol: "^GSPC" },
  { id: "nasdaq", label: "Nasdaq", symbol: "^IXIC" },
  { id: "dow", label: "Dow Jones", symbol: "^DJI" },
  { id: "merval", label: "S&P Merval", symbol: "^MERV" },
];

function okItem(item: Omit<TickerItem, "status">): TickerItem {
  return { ...item, status: typeof item.value === "number" && Number.isFinite(item.value) ? "ok" : "unavailable" };
}

async function getYahooIndexItem(input: { id: string; label: string; symbol: string }): Promise<TickerItem> {
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(input.symbol)}?range=5d&interval=1d`,
    { cache: "no-store", signal: AbortSignal.timeout(7_000) },
  );
  if (!response.ok) throw new Error(`Yahoo chart returned HTTP ${response.status}.`);

  const json = (await response.json()) as YahooChartResponse;
  const result = json.chart?.result?.[0];
  const normalized = normalizeMarketIndexSnapshot({
    regularMarketPrice: result?.meta?.regularMarketPrice,
    regularMarketTime: result?.meta?.regularMarketTime,
    currency: result?.meta?.currency,
    timestamps: result?.timestamp,
    closes: result?.indicators?.quote?.[0]?.close,
  });

  return okItem({
    id: input.id,
    label: input.label,
    value: normalized.value,
    changePercent: normalized.changePercent,
    currency: normalized.currency,
    source: "Yahoo Finance",
    updatedAt: normalized.updatedAt,
  });
}

export async function GET() {
  const [dollarResult, indexResults] = await Promise.all([
    getArgentinaDollarReferences().catch(() => ({ references: [], sources: { criptoYa: "unavailable" as const, dolarApi: "unavailable" as const } })),
    Promise.allSettled(yahooIndices.map(getYahooIndexItem)),
  ]);

  const indices = indexResults.flatMap((result, index) =>
    result.status === "fulfilled"
      ? [result.value]
      : [
          okItem({
            id: yahooIndices[index].id,
            label: yahooIndices[index].label,
            value: null,
            changePercent: null,
            currency: "USD",
            source: "Yahoo Finance",
            updatedAt: null,
          }),
        ],
  );

  const dollarItems = dollarResult.references.map((reference) => okItem(reference));
  const items = [...dollarItems, ...indices].filter((item) => item.status === "ok");
  const dollarSources = [...new Set(dollarItems.map((item) => item.source))];

  return Response.json(
    {
      items,
      fetchedAt: new Date().toISOString(),
      sources: [...dollarSources, "Yahoo Finance"],
      sourceStatus: dollarResult.sources,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=10",
      },
    },
  );
}
