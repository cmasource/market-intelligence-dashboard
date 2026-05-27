import { getMarketNews } from "@/lib/news";
import { sanitizeNewsArticle } from "@/lib/news/sanitize-news";

export async function GET() {
  try {
    const news = await getMarketNews();
    return Response.json({ ...news, articles: news.articles.map(sanitizeNewsArticle) }, {
      headers: {
        "Cache-Control": "s-maxage=180, stale-while-revalidate=600",
      },
    });
  } catch {
    return Response.json({ articles: [], provider: "mock", isFallback: true, sourceLabel: "Mock news", error: "News request failed." });
  }
}
