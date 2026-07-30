import { analyzeTradeRadar } from "@/lib/technical/trade-radar";
import type { TradeRadarInterval, TradeRadarMarket, TradeRadarProviderName } from "@/lib/market-data/providers/base";

export const dynamic = "force-dynamic";

const markets: TradeRadarMarket[] = ["us", "argentina", "cedear", "crypto", "bond", "auto"];
const intervals: TradeRadarInterval[] = ["1h", "4h", "1d"];
const providers: TradeRadarProviderName[] = ["auto", "yahoo", "twelveData", "alphaVantage", "fmp", "byma", "binance"];

type AnalyzeBody = {
  instrumentId?: unknown;
  symbol?: unknown;
  market?: unknown;
  interval?: unknown;
  provider?: unknown;
};

function parseParams(input: URLSearchParams | AnalyzeBody) {
  const getValue = (name: keyof AnalyzeBody) =>
    input instanceof URLSearchParams ? input.get(name) : input[name];

  const symbol = String(getValue("symbol") ?? "").trim().toUpperCase();
  const instrumentId = String(getValue("instrumentId") ?? "").trim();
  const market = String(getValue("market") ?? "auto") as TradeRadarMarket;
  const interval = String(getValue("interval") ?? "4h") as TradeRadarInterval;
  const provider = String(getValue("provider") ?? "auto") as TradeRadarProviderName;

  return { instrumentId: instrumentId || undefined, symbol, market, interval, provider };
}

function validate(params: ReturnType<typeof parseParams>) {
  if (!params.symbol && !params.instrumentId) return "symbol or instrumentId is required.";
  if (!markets.includes(params.market)) return `Unsupported market. Use: ${markets.join(", ")}.`;
  if (!intervals.includes(params.interval)) return `Unsupported interval. Use: ${intervals.join(", ")}.`;
  if (!providers.includes(params.provider)) return `Unsupported provider. Use: ${providers.join(", ")}.`;
  return null;
}

async function handle(params: ReturnType<typeof parseParams>) {
  const error = validate(params);
  if (error) return Response.json({ error }, { status: 400 });

  try {
    const analysis = await analyzeTradeRadar(params);
    return Response.json(analysis, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (requestError) {
    return Response.json(
      {
        error: requestError instanceof Error ? requestError.message : "Trade Radar analysis failed.",
        symbol: params.symbol,
        market: params.market,
        interval: params.interval,
        provider: params.provider,
      },
      { status: 502 },
    );
  }
}

export async function GET(request: Request) {
  return handle(parseParams(new URL(request.url).searchParams));
}

export async function POST(request: Request) {
  try {
    return handle(parseParams((await request.json()) as AnalyzeBody));
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
}
