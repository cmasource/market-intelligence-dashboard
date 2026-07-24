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

type DolarApiQuote = {
  casa: string;
  nombre: string;
  venta: number;
  fechaActualizacion: string;
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        regularMarketChangePercent?: number;
        currency?: string;
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

const dolarPriority = new Map([
  ["oficial", "USD oficial"],
  ["blue", "USD blue"],
  ["bolsa", "USD MEP"],
  ["contadoconliqui", "USD CCL"],
  ["cripto", "USD cripto"],
]);

function okItem(item: Omit<TickerItem, "status">): TickerItem {
  return { ...item, status: typeof item.value === "number" && Number.isFinite(item.value) ? "ok" : "unavailable" };
}

async function getDolarApiItems(): Promise<TickerItem[]> {
  const response = await fetch("https://dolarapi.com/v1/dolares", {
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`DolarAPI returned HTTP ${response.status}.`);

  const quotes = (await response.json()) as DolarApiQuote[];
  return quotes
    .filter((quote) => dolarPriority.has(quote.casa))
    .map((quote) =>
      okItem({
        id: `usd-${quote.casa}`,
        label: dolarPriority.get(quote.casa) ?? quote.nombre,
        value: quote.venta,
        changePercent: null,
        currency: "ARS",
        source: "DolarAPI",
        updatedAt: quote.fechaActualizacion,
      }),
    );
}

async function getYahooIndexItem(input: { id: string; label: string; symbol: string }): Promise<TickerItem> {
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(input.symbol)}?range=5d&interval=1d`,
    { next: { revalidate: 60 } },
  );
  if (!response.ok) throw new Error(`Yahoo chart returned HTTP ${response.status}.`);

  const json = (await response.json()) as YahooChartResponse;
  const meta = json.chart?.result?.[0]?.meta;
  const value = meta?.regularMarketPrice ?? null;
  const previousClose = meta?.chartPreviousClose ?? null;
  const changePercent =
    typeof meta?.regularMarketChangePercent === "number"
      ? meta.regularMarketChangePercent
      : typeof value === "number" && typeof previousClose === "number" && previousClose > 0
        ? ((value - previousClose) / previousClose) * 100
        : null;

  return okItem({
    id: input.id,
    label: input.label,
    value,
    changePercent,
    currency: meta?.currency ?? "USD",
    source: "Yahoo compatible",
    updatedAt: new Date().toISOString(),
  });
}

export async function GET() {
  const [dolarResult, indexResults] = await Promise.all([
    getDolarApiItems().catch(() => []),
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
            source: "Yahoo compatible",
            updatedAt: null,
          }),
        ],
  );

  const items = [...dolarResult, ...indices].filter((item) => item.status === "ok");

  return Response.json(
    {
      items,
      fetchedAt: new Date().toISOString(),
      sources: ["DolarAPI", "Yahoo compatible"],
    },
    {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
