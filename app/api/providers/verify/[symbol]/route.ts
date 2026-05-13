import { verifyQuoteProvider } from "@/lib/providers";

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
    return Response.json(await verifyQuoteProvider(symbol), {
      headers: {
        "Cache-Control": "s-maxage=30, stale-while-revalidate=120",
      },
    });
  } catch {
    return Response.json(
      { error: "Provider verification failed.", symbol },
      { status: 500 },
    );
  }
}
