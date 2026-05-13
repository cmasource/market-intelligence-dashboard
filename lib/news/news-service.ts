import { getAlphaVantageNews, getFinnhubCompanyNews, getFmpNews } from "@/lib/providers";
import { getGoogleNewsRss } from "./google-news-rss";
import { getMockMarketNews, getMockNewsForSymbol } from "./mock-news";
import type { NewsResponse } from "./types";

function normalize(symbol: string) {
  return symbol.trim().toUpperCase();
}

function responseFromProvider(result: Awaited<ReturnType<typeof getFmpNews>>, sourceLabel: string): NewsResponse | null {
  if (!result.ok || result.data.length === 0) return null;
  return {
    articles: result.data,
    provider: result.provider,
    isFallback: false,
    sourceLabel,
  };
}

export async function getNewsForSymbol(symbol: string, limit = 6): Promise<NewsResponse> {
  const normalized = normalize(symbol);
  const providers = [
    { label: "FMP provider news", load: () => getFmpNews(normalized) },
    { label: "Finnhub provider news", load: () => getFinnhubCompanyNews(normalized) },
    { label: "Alpha Vantage provider news", load: () => getAlphaVantageNews(normalized) },
  ];

  for (const provider of providers) {
    const response = responseFromProvider(await provider.load(), provider.label);
    if (response) return { ...response, articles: response.articles.slice(0, limit) };
  }

  const rss = await getGoogleNewsRss(normalized, limit);
  if (rss.articles.length > 0) return rss;

  const mock = getMockNewsForSymbol(normalized, limit);
  return rss.error ? { ...mock, error: rss.error } : mock;
}

export async function getMarketNews(limit = 8): Promise<NewsResponse> {
  const rss = await getGoogleNewsRss("markets stocks ETFs crypto", limit);
  if (rss.articles.length > 0) return rss;
  return getMockMarketNews(limit);
}
