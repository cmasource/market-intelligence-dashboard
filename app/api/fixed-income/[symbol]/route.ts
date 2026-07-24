export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params;
  const normalizedSymbol = decodeURIComponent(symbol ?? "").trim().toUpperCase();

  if (!normalizedSymbol) {
    return Response.json({ error: "Symbol is required." }, { status: 400 });
  }

  return Response.json(
    {
      error: "Validated cash flows and official terms are required before publishing fixed-income analytics.",
      symbol: normalizedSymbol,
      quoteEndpoint: `/api/market-data/quote/${encodeURIComponent(normalizedSymbol)}`,
    },
    { status: 501, headers: { "Cache-Control": "no-store" } },
  );
}
