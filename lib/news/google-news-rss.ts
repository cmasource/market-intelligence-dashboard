import type { NewsArticle, NewsResponse } from "./types";
import { sanitizeNewsText } from "./sanitize-news";

function tag(item: string, name: string) {
  const match = item.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
  return match?.[1] ? sanitizeNewsText(match[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "")) : undefined;
}

export async function getGoogleNewsRss(query: string, limit = 6, language: "en" | "es" = "en"): Promise<NewsResponse> {
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", language === "es" ? `${query} acciones bolsa mercado` : `${query} stock market`);
  url.searchParams.set("hl", language === "es" ? "es-419" : "en-US");
  url.searchParams.set("gl", language === "es" ? "AR" : "US");
  url.searchParams.set("ceid", language === "es" ? "AR:es-419" : "US:en");

  try {
    const response = await fetch(url, { next: { revalidate: 300 } });
    if (!response.ok) throw new Error(`Google News RSS returned HTTP ${response.status}`);
    const xml = await response.text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
    const articles: NewsArticle[] = items.slice(0, limit).map((item) => ({
      title: sanitizeNewsText(tag(item, "title"), 180) || "Market headline",
      source: sanitizeNewsText(tag(item, "source"), 80) || "Google News RSS",
      url: tag(item, "link") ?? "#",
      publishedAt: tag(item, "pubDate"),
      summary: sanitizeNewsText(tag(item, "description"), 240),
      relatedSymbols: [query.toUpperCase()],
      provider: "rss",
      isFallback: true,
    }));

    return { articles, provider: "rss", isFallback: true, sourceLabel: "Google News RSS fallback" };
  } catch (error) {
    return {
      articles: [],
      provider: "rss",
      isFallback: true,
      sourceLabel: "Google News RSS fallback",
      error: error instanceof Error ? error.message : "Google News RSS request failed",
    };
  }
}
