import { getFinnhubEarningsCalendar } from "@/lib/providers";

export const dynamic = "force-dynamic";

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function normalizeDate(value: string | null, fallback: Date) {
  if (!value) return isoDate(fallback);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? isoDate(fallback) : isoDate(parsed);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const today = new Date();
  const defaultTo = new Date(today);
  defaultTo.setDate(defaultTo.getDate() + 45);
  const from = normalizeDate(url.searchParams.get("from"), today);
  const to = normalizeDate(url.searchParams.get("to"), defaultTo);
  const symbol = url.searchParams.get("symbol")?.trim().toUpperCase() || undefined;

  const result = await getFinnhubEarningsCalendar({ from, to, symbol });

  if (!result.ok) {
    return Response.json(
      {
        events: [],
        provider: "finnhub",
        sourceLabel: "Finnhub earnings calendar",
        isFallback: false,
        error: result.error,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    {
      events: result.data.earningsCalendar ?? [],
      provider: "finnhub",
      sourceLabel: "Finnhub earnings calendar",
      isFallback: false,
      from,
      to,
    },
    { headers: { "Cache-Control": "s-maxage=900, stale-while-revalidate=3600" } },
  );
}
