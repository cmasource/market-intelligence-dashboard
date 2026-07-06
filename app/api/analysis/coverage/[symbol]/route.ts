import { getAnalysisCoverage } from "@/lib/analysis/analysis-coverage";

export const revalidate = 300;

export async function GET(
  _request: Request,
  context: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await context.params;
  const symbol = decodeURIComponent(rawSymbol ?? "").trim();

  if (!symbol) {
    return Response.json({ error: "Symbol is required." }, { status: 400 });
  }

  return Response.json(getAnalysisCoverage(symbol), {
    headers: {
      "Cache-Control": "s-maxage=300, stale-while-revalidate=900",
    },
  });
}

