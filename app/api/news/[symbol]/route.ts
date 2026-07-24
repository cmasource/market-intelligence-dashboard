import { getNewsForSymbol } from "@/lib/news";
import { sanitizeNewsArticle } from "@/lib/news/sanitize-news";

export async function GET(
  _request: Request,
  context: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await context.params;
  const symbol = decodeURIComponent(rawSymbol ?? "").trim().toUpperCase();
  if (!symbol) return Response.json({ error: "Symbol is required." }, { status: 400 });

  try {
    const news = await getNewsForSymbol(symbol);
    return Response.json({ ...news, articles: news.articles.map(sanitizeNewsArticle) }, {
      headers: {
        "Cache-Control": "s-maxage=180, stale-while-revalidate=600",
      },
    });
  } catch {
    return Response.json({ articles: [], provider: "unavailable", isFallback: true, sourceLabel: "News unavailable", error: "News request failed." });
  }
}
