import { getCedearAnalytics } from "@/lib/cedears";

export async function GET(
  _request: Request,
  context: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await context.params;
  const symbol = decodeURIComponent(rawSymbol ?? "").trim().toUpperCase();

  if (!symbol) {
    return Response.json({ error: "Symbol is required." }, { status: 400 });
  }

  try {
    const analytics = await getCedearAnalytics(symbol);
    if (!analytics) {
      return Response.json({ error: "Known CEDEAR not found.", symbol }, { status: 404 });
    }

    return Response.json(analytics, {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch {
    return Response.json({ error: "CEDEAR analytics request failed.", symbol }, { status: 500 });
  }
}
