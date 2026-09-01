import { getAlphaVantageNews, getFinnhubCompanyNews, getFmpNews } from "@/lib/providers";
import { getGoogleNewsRss } from "./google-news-rss";
import { sanitizeNewsArticle, sanitizeNewsText } from "./sanitize-news";
import { orderNewsArticles } from "./order-news";
import type { NewsArticle, NewsResponse } from "./types";

function normalize(symbol: string) {
  return symbol.trim().toUpperCase();
}

function responseFromProvider(result: Awaited<ReturnType<typeof getFmpNews>>, sourceLabel: string): NewsResponse | null {
  if (!result.ok || result.data.length === 0) return null;
  return {
    articles: result.data.map(cleanArticle),
    provider: result.provider,
    isFallback: false,
    sourceLabel,
  };
}

function cleanArticle(article: NewsArticle): NewsArticle {
  return sanitizeNewsArticle(article);
}

const argentinaMarketFeeds = [
  { url: "https://www.ambito.com/rss/pages/economia.xml", source: "Ambito" },
  { url: "https://www.infobae.com/arc/outboundfeeds/rss/category/economia/", source: "Infobae" },
  { url: "https://www.lanacion.com.ar/arc/outboundfeeds/rss/category/economia/", source: "La Nacion" },
  { url: "https://www.clarin.com/rss/economia/", source: "Clarin" },
];

function tag(item: string, name: string) {
  const match = item.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
  return match?.[1]?.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
}

function attr(item: string, tagName: string, attrName: string) {
  const match = item.match(new RegExp(`<${tagName}[^>]*\\s${attrName}=["']([^"']+)["'][^>]*>`, "i"));
  return match?.[1];
}

function imageFromRssItem(item: string) {
  return attr(item, "media:content", "url") ?? attr(item, "media:thumbnail", "url") ?? attr(item, "enclosure", "url");
}

async function getArgentinaMarketNews(limit = 8): Promise<NewsResponse | null> {
  const results = await Promise.allSettled(
    argentinaMarketFeeds.map(async (feed) => {
      const response = await fetch(feed.url, {
        headers: { "User-Agent": "CMA Markets market-intelligence-dashboard/1.0" },
        next: { revalidate: 300 },
      });
      if (!response.ok) throw new Error(`RSS ${feed.source} returned HTTP ${response.status}`);
      const xml = await response.text();
      const items = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
      return items.slice(0, 5).map((item): NewsArticle => ({
        title: sanitizeNewsText(tag(item, "title"), 180) || "Market update",
        source: feed.source,
        url: tag(item, "link") ?? feed.url,
        publishedAt: tag(item, "pubDate"),
        summary: sanitizeNewsText(tag(item, "description"), 240),
        imageUrl: imageFromRssItem(item),
        relatedSymbols: ["MERVAL", "ARGENTINA"],
        provider: "rss",
        isFallback: false,
      }));
    }),
  );

  const articles = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const ordered = orderNewsArticles(articles.map(cleanArticle));

  const perSourceCount = new Map<string, number>();
  const picked: NewsArticle[] = [];
  for (const article of ordered) {
    const count = perSourceCount.get(article.source) ?? 0;
    if (count >= 3) continue;
    perSourceCount.set(article.source, count + 1);
    picked.push(article);
    if (picked.length >= limit) break;
  }

  if (!picked.length) return null;
  return {
    articles: picked,
    provider: "rss",
    isFallback: false,
    sourceLabel: "Argentina market RSS",
  };
}

export async function getNewsForSymbol(symbol: string, limit = 6, language: "en" | "es" = "en"): Promise<NewsResponse> {
  const normalized = normalize(symbol);

  if (language === "es") {
    const spanishRss = await getGoogleNewsRss(normalized, Math.max(limit * 3, limit), "es");
    if (spanishRss.articles.length > 0) {
      return { ...spanishRss, articles: orderNewsArticles(spanishRss.articles.map(cleanArticle), limit) };
    }
  }

  const providers = [
    { label: "FMP provider news", load: () => getFmpNews(normalized) },
    { label: "Finnhub provider news", load: () => getFinnhubCompanyNews(normalized) },
    { label: "Alpha Vantage provider news", load: () => getAlphaVantageNews(normalized) },
  ];

  for (const provider of providers) {
    const response = responseFromProvider(await provider.load(), provider.label);
    if (response) return { ...response, articles: orderNewsArticles(response.articles.map(cleanArticle), limit) };
  }

  const rss = await getGoogleNewsRss(normalized, Math.max(limit * 3, limit), language);
  if (rss.articles.length > 0) return { ...rss, articles: orderNewsArticles(rss.articles.map(cleanArticle), limit) };

  return {
    articles: [],
    provider: "rss",
    isFallback: true,
    sourceLabel: "No verified news available",
    ...(rss.error ? { error: rss.error } : {}),
  };
}

export async function getMarketNews(limit = 8): Promise<NewsResponse> {
  const argentinaNews = await getArgentinaMarketNews(limit);
  if (argentinaNews) return argentinaNews;

  const rss = await getGoogleNewsRss("Argentina markets MERVAL BYMA stocks bonds", limit, "es");
  if (rss.articles.length > 0) return { ...rss, articles: orderNewsArticles(rss.articles.map(cleanArticle), limit) };
  return {
    articles: [],
    provider: "rss",
    isFallback: true,
    sourceLabel: "No verified market news available",
    ...(rss.error ? { error: rss.error } : {}),
  };
}
