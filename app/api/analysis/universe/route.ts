import { getAnalysisCoverageSummary, getAnalysisCoverageUniverse } from "@/lib/analysis/analysis-coverage";

export const revalidate = 300;

export async function GET(request: Request) {
  const type = new URL(request.url).searchParams.get("type") ?? undefined;
  const items = getAnalysisCoverageUniverse(type);

  return Response.json(
    {
      type: type ?? "all",
      summary: getAnalysisCoverageSummary(items),
      items,
    },
    {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=900",
      },
    },
  );
}

