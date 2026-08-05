import type { NextRequest } from "next/server";
import { getArbitrageQuotes } from "@/lib/arbitrage/quote-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const forceRefresh = request.nextUrl.searchParams.get("refresh") === "1";
  const payload = await getArbitrageQuotes(forceRefresh);
  return Response.json(payload, {
    headers: {
      "Cache-Control": forceRefresh ? "no-store" : "public, s-maxage=30, stale-while-revalidate=300",
    },
  });
}
