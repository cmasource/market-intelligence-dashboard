import { findAsset } from "@/lib/mock-data";
import type { NewsArticle, NewsResponse } from "./types";

export function getMockNewsForSymbol(symbol: string, limit = 6): NewsResponse {
  const normalized = symbol.trim().toUpperCase();
  const asset = findAsset(normalized);
  const articles: NewsArticle[] = (asset?.news ?? []).slice(0, limit).map((item) => ({
    title: item.title,
    source: item.source,
    url: "#",
    summary: item.summary,
    relatedSymbols: [normalized],
    provider: "mock",
    isFallback: true,
  }));

  return {
    articles,
    provider: "mock",
    isFallback: true,
    sourceLabel: "Mock news",
  };
}

export function getMockMarketNews(limit = 8): NewsResponse {
  const symbols = ["AAPL", "MSFT", "NVDA", "SPY", "BTC-USD", "AL30"];
  const articles = symbols.flatMap((symbol) => getMockNewsForSymbol(symbol, 2).articles).slice(0, limit);
  return {
    articles,
    provider: "mock",
    isFallback: true,
    sourceLabel: "Mock market news",
  };
}
