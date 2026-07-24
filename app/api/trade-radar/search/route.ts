import { searchInstruments } from "@/lib/instruments/searchInstruments";

export const dynamic = "force-dynamic";

type SearchSource = "instrument_master";

function normalizeLimit(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? Math.max(1, Math.min(parsed, 100)) : 50;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const limit = normalizeLimit(url.searchParams.get("limit"));
  if (query.trim().length < 2) {
    return Response.json({ query, results: [], source: "instrument_master" satisfies SearchSource }, { headers: { "Cache-Control": "no-store" } });
  }

  const results = searchInstruments({ query, limit });
  const source: SearchSource = "instrument_master";

  return Response.json({ query, results, source }, { headers: { "Cache-Control": "no-store" } });
}
