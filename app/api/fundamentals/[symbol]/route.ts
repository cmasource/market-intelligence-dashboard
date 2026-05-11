import { getFundamentals } from "@/lib/fundamentals-data";
import { normalizeFundamentalsSymbol } from "@/lib/fundamentals-data/symbol-map";

export async function GET(
  _request: Request,
  context: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await context.params;
  const symbol = normalizeFundamentalsSymbol(decodeURIComponent(rawSymbol ?? ""));

  if (!symbol) return Response.json({ error: "Symbol is required." }, { status: 400 });

  try {
    const fundamentals = await getFundamentals({ symbol });
    return Response.json(fundamentals, {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=900",
      },
    });
  } catch {
    return Response.json({ error: "Fundamentals request failed." }, { status: 500 });
  }
}
