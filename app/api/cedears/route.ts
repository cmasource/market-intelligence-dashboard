import { getAllCedearAnalytics } from "@/lib/cedears";

export async function GET() {
  try {
    const analytics = await getAllCedearAnalytics();
    return Response.json(analytics, {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch {
    return Response.json({ error: "CEDEAR analytics request failed." }, { status: 500 });
  }
}
