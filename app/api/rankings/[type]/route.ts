import { NextResponse } from "next/server";
import { getRankingByType } from "@/lib/rankings";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  try {
    const { type } = await params;
    const url = new URL(request.url);
    const ranking = getRankingByType(type, url.searchParams.get("period") ?? undefined);

    if (!ranking) {
      return NextResponse.json(
        {
          error: "Unsupported ranking type",
          supportedTypes: ["technical", "fundamental", "combined", "performance"],
        },
        { status: 404 },
      );
    }

    return NextResponse.json(ranking);
  } catch {
    return NextResponse.json(
      {
        error: "Ranking unavailable",
        limitations: ["No se exponen claves ni detalles internos del servidor."],
      },
      { status: 500 },
    );
  }
}
