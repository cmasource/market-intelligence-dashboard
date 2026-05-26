import { getAssetIntelligenceReport } from "@/lib/intelligence";

export async function GET(
  request: Request,
  context: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await context.params;
  const symbol = decodeURIComponent(rawSymbol ?? "").trim().toUpperCase();
  const language = new URL(request.url).searchParams.get("language") === "es" ? "es" : "en";

  if (!symbol) {
    return Response.json({ error: "Symbol is required." }, { status: 400 });
  }

  try {
    const report = await getAssetIntelligenceReport(symbol, language);

    if (!report) {
      return Response.json(
        {
          error: "Asset intelligence report is not available for this symbol.",
          symbol,
        },
        { status: 404 },
      );
    }

    return Response.json(report, {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=240",
      },
    });
  } catch {
    return Response.json(
      {
        error: "Asset intelligence report request failed.",
        symbol,
      },
      { status: 500 },
    );
  }
}
