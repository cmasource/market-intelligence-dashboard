import { getCauciones } from "@/lib/argentina/cauciones";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET() {
  try {
    const payload = await getCauciones();
    return Response.json(payload, {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=1800",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cauciones unavailable.";
    return Response.json({ quotes: [], alert: null, error: message }, { status: 502 });
  }
}
