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

  const seen = new Set<string>();
  const events = (result.data.earningsCalendar ?? [])
    .filter((event) => event.symbol && event.date)
    .filter((event) => {
      const key = `${event.symbol}|${event.date}|${event.quarter ?? ""}|${event.year ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => {
      const dateOrder = (left.date ?? "").localeCompare(right.date ?? "");
      return dateOrder || (left.symbol ?? "").localeCompare(right.symbol ?? "");
    });

  return Response.json(
    {
      events,
      total: events.length,
      provider: "finnhub",
      sourceLabel: "Finnhub earnings calendar",
      isFallback: false,
      from,
      to,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
