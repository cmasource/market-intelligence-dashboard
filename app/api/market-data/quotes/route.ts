import { getMarketQuote } from "@/lib/market-data";
import { normalizeSymbol } from "@/lib/market-data/symbol-map";
import type { MarketQuoteResponse } from "@/lib/market-data/types";

type BatchQuoteBody = {
  symbols?: unknown;
};

function normalizeSymbols(input: unknown) {
  if (!Array.isArray(input)) return [];

  return Array.from(
    new Set(
      input
        .filter((symbol): symbol is string => typeof symbol === "string")
        .map((symbol) => normalizeSymbol(symbol))
        .filter(Boolean),
    ),
  ).slice(0, 20);
}

function failedQuote(symbol: string, error: string): MarketQuoteResponse {
  return {
    symbol,
    price: null,
    change: null,
    changePercent: null,
    currency: "USD",
    provider: "unavailable",
    sourceLabel: "No verified quote",
    isFallback: true,
    fetchedAt: new Date().toISOString(),
    error,
  };
}

export async function POST(request: Request) {
  let body: BatchQuoteBody = {};

  try {
    body = await request.json() as BatchQuoteBody;
  } catch {
    return Response.json({ error: "Invalid JSON body.", quotes: {} }, { status: 400 });
  }

  const symbols = normalizeSymbols(body.symbols);

  if (!symbols.length) {
    return Response.json({ error: "At least one symbol is required.", quotes: {} }, { status: 400 });
  }

  const settledQuotes = await Promise.allSettled(symbols.map((symbol) => getMarketQuote(symbol)));
  const quotes = Object.fromEntries(
    settledQuotes.map((result, index) => {
      const symbol = symbols[index];
      if (result.status === "fulfilled") {
        const compactQuote = { ...result.value, providerTrace: undefined };
        return [symbol, compactQuote];
      }
      return [symbol, failedQuote(symbol, "Quote request failed.")];
    }),
  );

  return Response.json(
    { quotes },
    {
      headers: {
        "Cache-Control": "s-maxage=30, stale-while-revalidate=120",
      },
    },
  );
}
