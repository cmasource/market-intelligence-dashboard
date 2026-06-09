import { NextResponse } from "next/server";
import { getLatestCnvDocuments } from "@/lib/cnv";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? 8);
    const documents = getLatestCnvDocuments(Number.isFinite(limit) ? limit : 8);

    return NextResponse.json({
      documents,
      sourceLabel: documents.length ? "Structured demo document" : "Future CNV integration",
    });
  } catch {
    return NextResponse.json({ error: "CNV documents unavailable." }, { status: 500 });
  }
}
