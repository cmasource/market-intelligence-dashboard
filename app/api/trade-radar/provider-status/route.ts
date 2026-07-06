import { getTradeRadarProviderStatus } from "@/lib/market-data/trade-radar-provider-status";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(getTradeRadarProviderStatus(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
