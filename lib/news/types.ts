import type { ProviderName } from "@/lib/providers/types";

export type NewsArticle = {
  title: string;
  source: string;
  url: string;
  publishedAt?: string;
  summary?: string;
  relatedSymbols?: string[];
  provider: ProviderName | "rss";
  isFallback: boolean;
};

export type NewsResponse = {
  articles: NewsArticle[];
  provider: NewsArticle["provider"];
  isFallback: boolean;
  sourceLabel: string;
  error?: string;
};
