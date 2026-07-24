import { getFinnhubEconomicCalendar } from "@/lib/providers";

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
  defaultTo.setDate(defaultTo.getDate() + 14);
  const from = normalizeDate(url.searchParams.get("from"), today);
  const to = normalizeDate(url.searchParams.get("to"), defaultTo);

  const result = await getFinnhubEconomicCalendar({ from, to });

  if (!result.ok) {
    return Response.json(
      {
        events: [],
        provider: "finnhub",
        sourceLabel: "Finnhub economic calendar",
        isFallback: false,
        error: result.error,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    {
      events: result.data.economicCalendar ?? [],
      provider: "finnhub",
      sourceLabel: "Finnhub economic calendar",
      isFallback: false,
      from,
      to,
    },
    { headers: { "Cache-Control": "s-maxage=900, stale-while-revalidate=3600" } },
  );
}
