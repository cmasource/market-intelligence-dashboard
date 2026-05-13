import type { NewsArticle, NewsResponse } from "./types";

function decodeXml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'");
}

function tag(item: string, name: string) {
  const match = item.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
  return match?.[1] ? decodeXml(match[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim()) : undefined;
}

export async function getGoogleNewsRss(query: string, limit = 6): Promise<NewsResponse> {
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", `${query} stock market`);
  url.searchParams.set("hl", "en-US");
  url.searchParams.set("gl", "US");
  url.searchParams.set("ceid", "US:en");

  try {
    const response = await fetch(url, { next: { revalidate: 300 } });
    if (!response.ok) throw new Error(`Google News RSS returned HTTP ${response.status}`);
    const xml = await response.text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
    const articles: NewsArticle[] = items.slice(0, limit).map((item) => ({
      title: tag(item, "title") ?? "Market headline",
      source: tag(item, "source") ?? "Google News RSS",
      url: tag(item, "link") ?? "#",
      publishedAt: tag(item, "pubDate"),
      summary: tag(item, "description")?.replace(/<[^>]*>/g, "").slice(0, 240),
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
