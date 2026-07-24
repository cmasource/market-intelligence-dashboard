import { getAssetAnalysisBundle } from "@/lib/analysis/asset-analysis-bundle";

export async function GET(
  request: Request,
  context: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await context.params;
  const symbol = decodeURIComponent(rawSymbol ?? "").trim().toUpperCase();
  const language = new URL(request.url).searchParams.get("language") === "es" ? "es" : "en";

  if (!symbol) return Response.json({ error: "Symbol is required." }, { status: 400 });

  const analysis = await getAssetAnalysisBundle(symbol, language);
  return Response.json(analysis, {
    headers: {
      "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
    },
  });
}

