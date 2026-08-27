import { getMarketQuote } from "@/lib/market-data";
import { normalizeSymbol } from "@/lib/market-data/symbol-map";

export async function GET(
  request: Request,
  context: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await context.params;
  const symbol = normalizeSymbol(decodeURIComponent(rawSymbol ?? ""));
  const requestUrl = new URL(request.url);
  const debug = requestUrl.searchParams.get("debug") === "1";
  const instrumentId = requestUrl.searchParams.get("instrumentId")?.trim() || undefined;

  if (!symbol) {
    return Response.json({ error: "Symbol is required." }, { status: 400 });
  }

  try {
    const quote = await getMarketQuote(symbol, { instrumentId });
    const responseBody = debug ? quote : { ...quote, providerTrace: undefined };

    return Response.json(responseBody, {
      headers: {
        "Cache-Control": "s-maxage=15, stale-while-revalidate=30",
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
        provider: "unavailable",
        sourceLabel: "No verified quote",
        isFallback: true,
        fetchedAt: new Date().toISOString(),
        error: "Quote request failed.",
      },
      { status: 200 },
    );
  }
}
