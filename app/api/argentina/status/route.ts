import { NextResponse } from "next/server";
import { getArgentinaSourceStatus } from "@/lib/argentina";

export async function GET() {
  try {
    return NextResponse.json({ sources: getArgentinaSourceStatus() });
  } catch {
    return NextResponse.json({ error: "Argentina status unavailable." }, { status: 500 });
  }
}
