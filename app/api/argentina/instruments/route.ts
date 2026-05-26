import { NextResponse } from "next/server";
import { getArgentinaInstruments } from "@/lib/argentina";

export async function GET() {
  try {
    return NextResponse.json({ instruments: getArgentinaInstruments() });
  } catch {
    return NextResponse.json({ error: "Argentina instruments unavailable." }, { status: 500 });
  }
}
