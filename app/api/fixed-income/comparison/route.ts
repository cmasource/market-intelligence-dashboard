import { getFixedIncomeComparison } from "@/lib/fixed-income";

export async function GET() {
  try {
    const items = await getFixedIncomeComparison();
    return Response.json(items, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json({ error: "Fixed income comparison is not available." }, { status: 500 });
  }
}
