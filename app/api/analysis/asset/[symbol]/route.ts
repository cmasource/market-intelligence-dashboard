import { getAssetAnalysisBundle } from "@/lib/analysis/asset-analysis-bundle";

export async function GET(
  request: Request,
  context: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await context.params;
  const symbol = decodeURIComponent(rawSymbol ?? "").trim().toUpperCase();
  const searchParams = new URL(request.url).searchParams;
  const language = searchParams.get("language") === "es" ? "es" : "en";
  const instrumentId = searchParams.get("instrumentId") ?? undefined;

  if (!symbol) return Response.json({ error: "Symbol is required." }, { status: 400 });

  const analysis = await getAssetAnalysisBundle(symbol, language, instrumentId);
  return Response.json(analysis, {
    headers: {
      "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
    },
  });
}

