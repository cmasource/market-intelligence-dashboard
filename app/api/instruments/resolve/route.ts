import { resolveInstrument } from "@/lib/instruments/resolveInstrument";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const instrumentId = url.searchParams.get("instrumentId") ?? undefined;
  const symbol = url.searchParams.get("symbol") ?? undefined;
  const resolution = resolveInstrument({ instrumentId, symbol });

  if (!resolution) return Response.json({ error: "Instrument not found." }, { status: 404 });

  return Response.json(resolution, { headers: { "Cache-Control": "no-store" } });
}
