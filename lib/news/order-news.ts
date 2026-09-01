import type { NewsArticle } from "./types";

function publishedTimestamp(article: NewsArticle) {
  if (!article.publishedAt) return Number.NEGATIVE_INFINITY;
  const timestamp = Date.parse(article.publishedAt);
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
}

function articleKey(article: NewsArticle) {
  const url = article.url.trim().toLowerCase();
  if (url && url !== "#") return `url:${url}`;
  return `title:${article.title.trim().toLowerCase()}|${article.source.trim().toLowerCase()}`;
}

export function orderNewsArticles(articles: NewsArticle[], limit = articles.length) {
  const ordered = articles
    .map((article, index) => ({ article, index }))
    .sort((a, b) => publishedTimestamp(b.article) - publishedTimestamp(a.article) || a.index - b.index);

  const seen = new Set<string>();
  const result: NewsArticle[] = [];
  for (const { article } of ordered) {
    const key = articleKey(article);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(article);
    if (result.length >= limit) break;
  }
  return result;
}
