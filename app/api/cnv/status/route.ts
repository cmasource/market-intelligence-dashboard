import { NextResponse } from "next/server";
import { getCnvSourceStatus } from "@/lib/cnv";

export async function GET() {
  try {
    return NextResponse.json(getCnvSourceStatus());
  } catch {
    return NextResponse.json({ error: "CNV status unavailable." }, { status: 500 });
  }
}
