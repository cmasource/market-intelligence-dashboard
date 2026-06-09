import { NextResponse } from "next/server";
import { getRankingsBundle } from "@/lib/rankings";

export async function GET() {
  try {
    return NextResponse.json(getRankingsBundle());
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
