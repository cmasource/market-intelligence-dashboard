import { getTodayBrief } from "@/lib/research/today-brief-service";

export const maxDuration = 30;

export async function GET(request: Request) {
  const language = new URL(request.url).searchParams.get("language") === "en" ? "en" : "es";
  try {
    const brief = await getTodayBrief(language);
    return Response.json(brief, {
      headers: {
        "Cache-Control": "s-maxage=900, stale-while-revalidate=1800",
      },
    });
  } catch {
    return Response.json({ error: language === "es" ? "El informe de hoy no esta disponible." : "Today's brief is unavailable." }, { status: 500 });
  }
}
