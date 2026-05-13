import { getMarketNews } from "@/lib/news";

export async function GET() {
  try {
    const news = await getMarketNews();
    return Response.json(news, {
      headers: {
        "Cache-Control": "s-maxage=180, stale-while-revalidate=600",
      },
    });
  } catch {
    return Response.json({ articles: [], provider: "mock", isFallback: true, sourceLabel: "Mock news", error: "News request failed." });
  }
}
