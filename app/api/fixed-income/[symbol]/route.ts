import { getFixedIncomeAnalytics } from "@/lib/fixed-income";

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
    return Response.json(analytics, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json(
      {
        error: "Fixed income analytics are not available for this symbol in the current mock universe.",
        symbol: normalizedSymbol,
      },
      { status: 404 },
    );
  }
}
