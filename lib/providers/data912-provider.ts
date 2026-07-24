const BASE_URL = "https://data912.com";
const REVALIDATE_SECONDS = 20;
const REQUEST_TIMEOUT_MS = 8000;

export type Data912Category =
  | "arg_stocks"
  | "arg_cedears"
  | "arg_bonds"
  | "arg_notes"
  | "arg_corp";

export type Data912LiveQuote = {
  symbol: string;
  c: number;
  v: number;
  q_bid: number;
  px_bid: number;
  px_ask: number;
  q_ask: number;
  q_op: number;
  pct_change: number;
};

export async function getData912LiveQuotes(category: Data912Category) {
  const response = await fetch(`${BASE_URL}/live/${category}`, {
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) return [];
  return (await response.json()) as Data912LiveQuote[];
}

export async function getData912LiveQuote(category: Data912Category, symbol: string) {
  const normalized = symbol.trim().toUpperCase();
  const quotes = await getData912LiveQuotes(category);
  return quotes.find((quote) => quote.symbol.trim().toUpperCase() === normalized) ?? null;
}
