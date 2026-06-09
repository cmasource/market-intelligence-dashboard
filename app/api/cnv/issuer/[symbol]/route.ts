import { NextResponse } from "next/server";
import { getCnvIssuer } from "@/lib/cnv";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const { symbol } = await params;
    const normalized = decodeURIComponent(symbol ?? "").trim().toUpperCase();
    const issuer = getCnvIssuer(normalized);

    if (!issuer) {
      return NextResponse.json(
        {
          symbol: normalized,
          issuer: null,
          error: "CNV issuer not registered.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ symbol: normalized, issuer });
  } catch {
    return NextResponse.json({ error: "CNV issuer unavailable." }, { status: 500 });
  }
}
