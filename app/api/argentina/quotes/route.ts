import { NextResponse } from "next/server";
import { getArgentinaQuotes } from "@/lib/argentina";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbols = (searchParams.get("symbols") ?? "")
      .split(",")
      .map((symbol) => symbol.trim())
      .filter(Boolean);
    const quotes = await getArgentinaQuotes(symbols);
    return NextResponse.json({ quotes });
  } catch {
    return NextResponse.json({ error: "Argentina quotes unavailable." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { symbols?: string[] };
    const quotes = await getArgentinaQuotes(Array.isArray(body.symbols) ? body.symbols : []);
    return NextResponse.json({ quotes });
  } catch {
    return NextResponse.json({ error: "Argentina quotes unavailable." }, { status: 500 });
  }
}
