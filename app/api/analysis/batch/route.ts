import { getAnalysisCoverage } from "@/lib/analysis/analysis-coverage";

const maxBatchSize = 50;

export const revalidate = 120;

function parseSymbols(request: Request) {
  const value = new URL(request.url).searchParams.get("symbols") ?? "";
  return Array.from(
    new Set(
      value
        .split(",")
        .map((symbol) => symbol.trim())
        .filter(Boolean),
    ),
  ).slice(0, maxBatchSize);
}

export async function GET(request: Request) {
  const symbols = parseSymbols(request);

  if (symbols.length === 0) {
    return Response.json({ error: "At least one symbol is required.", maxBatchSize }, { status: 400 });
  }

  return Response.json(
    {
      generatedAt: new Date().toISOString(),
      requested: symbols.length,
      maxBatchSize,
      items: symbols.map((symbol) => getAnalysisCoverage(symbol)),
      sourceSummary: "Coverage-only batch endpoint. No live provider calls and no secrets exposed.",
    },
    {
      headers: {
        "Cache-Control": "s-maxage=120, stale-while-revalidate=300",
      },
    },
  );
}

