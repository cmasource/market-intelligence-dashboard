import { getFallbackTechnicalAnalysis, getTechnicalAnalysis } from "@/lib/analysis";
import { normalizeSymbol } from "@/lib/market-data/symbol-map";
import type { MarketDataTimeframe } from "@/lib/market-data/types";

const supportedTimeframes: MarketDataTimeframe[] = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y"];

function isSupportedTimeframe(value: string | null): value is MarketDataTimeframe {
  return supportedTimeframes.includes(value as MarketDataTimeframe);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await context.params;
  const symbol = normalizeSymbol(decodeURIComponent(rawSymbol ?? ""));
  const url = new URL(request.url);
  const timeframe = url.searchParams.get("timeframe");
  const debug = url.searchParams.get("debug") === "1";

  if (!symbol) return Response.json({ error: "Symbol is required." }, { status: 400 });

  if (!isSupportedTimeframe(timeframe)) {
    return Response.json({ error: "Unsupported timeframe.", supportedTimeframes }, { status: 400 });
  }

  try {
    const analysis = await getTechnicalAnalysis(symbol, timeframe);
    const responseBody = debug ? analysis : { ...analysis, providerTrace: undefined, analysisWarnings: undefined };

    return Response.json(responseBody, {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    const fallback = getFallbackTechnicalAnalysis(symbol, timeframe, [
      error instanceof Error ? error.message : "Technical analysis request failed.",
    ]);
    const responseBody = debug ? fallback : { ...fallback, providerTrace: undefined, analysisWarnings: undefined };

    return Response.json(responseBody, {
      headers: {
        "Cache-Control": "s-maxage=30, stale-while-revalidate=120",
      },
    });
  }
}
