import { searchInstruments } from "@/lib/instruments/searchInstruments";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const parsedLimit = Number(url.searchParams.get("limit") ?? 50);
  const limit = Number.isInteger(parsedLimit) ? Math.max(1, Math.min(parsedLimit, 100)) : 50;
  return Response.json(
    { query: q, results: searchInstruments({ query: q, limit }), source: "instrument_master" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
