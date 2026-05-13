import { getMarketQuote } from "@/lib/market-data";
import { normalizeSymbol } from "@/lib/market-data/symbol-map";

export async function GET(
  request: Request,
  context: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await context.params;
  const symbol = normalizeSymbol(decodeURIComponent(rawSymbol ?? ""));
  const debug = new URL(request.url).searchParams.get("debug") === "1";

  if (!symbol) {
    return Response.json({ error: "Symbol is required." }, { status: 400 });
  }

  try {
    const quote = await getMarketQuote(symbol);
    const responseBody = debug ? quote : { ...quote, providerTrace: undefined };

    return Response.json(responseBody, {
      headers: {
        "Cache-Control": "s-maxage=30, stale-while-revalidate=120",
      },
    });
  } catch {
    return Response.json(
      {
        symbol,
        price: null,
        change: null,
        changePercent: null,
        currency: "USD",
        provider: "mock",
        sourceLabel: "Mock fallback",
        isFallback: true,
        fetchedAt: new Date().toISOString(),
        error: "Quote request failed.",
      },
      { status: 200 },
    );
  }
}
