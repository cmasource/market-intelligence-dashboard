import assert from "node:assert/strict";
import test from "node:test";
import { orderNewsArticles } from "@/lib/news/order-news";
import type { NewsArticle } from "@/lib/news/types";

function article(title: string, publishedAt?: string, url = `https://example.com/${title}`): NewsArticle {
  return {
    title,
    source: "Test",
    url,
    publishedAt,
    provider: "rss",
    isFallback: false,
  };
}

test("news is ordered newest first and undated entries remain last", () => {
  const ordered = orderNewsArticles([
    article("old", "2026-08-29T12:00:00Z"),
    article("missing"),
    article("new", "2026-09-01T10:00:00Z"),
    article("invalid", "not-a-date"),
  ]);

  assert.deepEqual(ordered.map((item) => item.title), ["new", "old", "missing", "invalid"]);
});

test("news ordering removes duplicate URLs before applying the limit", () => {
  const ordered = orderNewsArticles([
    article("older duplicate", "2026-08-30T10:00:00Z", "https://example.com/shared"),
    article("newer duplicate", "2026-09-01T10:00:00Z", "https://example.com/shared"),
    article("second", "2026-08-31T10:00:00Z"),
  ], 2);

  assert.deepEqual(ordered.map((item) => item.title), ["newer duplicate", "second"]);
});
