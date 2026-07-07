import { searchInstruments } from "@/lib/instruments/searchInstruments";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const limit = Number(url.searchParams.get("limit") ?? 12);
  return Response.json(
    { query: q, results: searchInstruments({ query: q, limit }), source: "instrument_master" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
