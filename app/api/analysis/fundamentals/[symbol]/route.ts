import { getFundamentals } from "@/lib/fundamentals-data";
import { normalizeFundamentalsSymbol } from "@/lib/fundamentals-data/symbol-map";

export async function GET(
  request: Request,
  context: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await context.params;
  const symbol = normalizeFundamentalsSymbol(decodeURIComponent(rawSymbol ?? ""));
  const debug = new URL(request.url).searchParams.get("debug") === "1";

  if (!symbol) {
    return Response.json({ error: "Symbol is required." }, { status: 400 });
  }

  try {
    const fundamentals = await getFundamentals({ symbol });
    const responseBody = {
      ...fundamentals,
      metrics: fundamentals.snapshot,
      coverageRatio: fundamentals.coverageRatio,
      ...(!debug ? { providerTrace: undefined } : {}),
    };

    return Response.json(responseBody, {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=900",
      },
    });
  } catch (error) {
    return Response.json(
      {
        symbol,
        provider: "unavailable",
        sourceLabel: "Unavailable",
        isFallback: false,
        metrics: {},
        missingFields: [],
        coverageRatio: 0,
        error: error instanceof Error ? error.message : "Unexpected fundamentals error.",
      },
      { status: 500 },
    );
  }
}
