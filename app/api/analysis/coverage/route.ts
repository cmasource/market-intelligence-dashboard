import { getAnalysisCoverageSummary, getAnalysisCoverageUniverse } from "@/lib/analysis/analysis-coverage";

export const revalidate = 300;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? undefined;
  const items = getAnalysisCoverageUniverse(type);

  return Response.json(
    {
      generatedAt: new Date().toISOString(),
      summary: getAnalysisCoverageSummary(items),
      items,
      limitations: [
        "Coverage describes analytical availability, not investment suitability.",
        "Provider availability can differ by environment and provider plan.",
        "No secrets are exposed by this endpoint.",
      ],
    },
    {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=900",
      },
    },
  );
}

