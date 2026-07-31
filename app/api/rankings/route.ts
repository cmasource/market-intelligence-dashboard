import { NextResponse } from "next/server";
import { getRankingsBundle } from "@/lib/rankings";

export async function GET() {
  try {
    return NextResponse.json(await getRankingsBundle(), {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=120, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json(
      {
        error: "Rankings unavailable",
        limitations: ["No se exponen claves ni detalles internos del servidor."],
      },
      { status: 500 },
    );
  }
}
