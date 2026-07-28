export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params;
  const normalizedSymbol = decodeURIComponent(symbol ?? "").trim().toUpperCase();

  if (!normalizedSymbol) {
    return Response.json({ error: "Symbol is required." }, { status: 400 });
  }

  try {
    const analytics = await getFixedIncomeAnalytics(normalizedSymbol);
    return Response.json(analytics, { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fixed income analysis unavailable.";
    return Response.json({ error: message, symbol: normalizedSymbol }, { status: message.startsWith("Unsupported") ? 404 : 503 });
  }
}
import { getFixedIncomeAnalytics } from "@/lib/fixed-income";
