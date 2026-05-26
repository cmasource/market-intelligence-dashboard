import { NextResponse } from "next/server";
import { getArgentinaQuote } from "@/lib/argentina";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const { symbol } = await params;
    const quote = await getArgentinaQuote(decodeURIComponent(symbol));
    return NextResponse.json(quote);
  } catch {
    return NextResponse.json({ error: "Argentina quote unavailable." }, { status: 500 });
  }
}
