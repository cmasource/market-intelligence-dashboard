import { NextResponse } from "next/server";
import { getCnvDocumentsForSymbol, getCnvIssuer } from "@/lib/cnv";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const { symbol } = await params;
    const normalized = decodeURIComponent(symbol ?? "").trim().toUpperCase();
    const issuer = getCnvIssuer(normalized);
    const documents = getCnvDocumentsForSymbol(normalized);

    if (!issuer) {
      return NextResponse.json(
        {
          symbol: normalized,
          issuer: null,
          documents: [],
          error: "CNV issuer not registered.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      symbol: normalized,
      issuer,
      documents,
      sourceLabel: documents.length ? "Structured demo document" : "Future CNV integration",
    });
  } catch {
    return NextResponse.json({ error: "CNV documents unavailable." }, { status: 500 });
  }
}
