import assert from "node:assert/strict";
import test from "node:test";
import { buildDeterministicTodayNarrative, todaySources, type TodayMarketSnapshot } from "@/lib/research/today-brief";
import type { NewsArticle } from "@/lib/news";

const snapshots: TodayMarketSnapshot[] = [
  { symbol: "SPY", label: "S&P 500", market: "international", price: 700, dailyChange: 1.1, weeklyChange: 2.2, currency: "USD", sourceLabel: "Yahoo", observedAt: "2026-09-02T14:00:00.000Z" },
  { symbol: "AL30", label: "AL30", market: "argentina", price: 100, dailyChange: 0.8, weeklyChange: null, currency: "ARS", sourceLabel: "PPI", observedAt: "2026-09-02T14:00:00.000Z" },
];

function article(title: string, url: string): NewsArticle {
  return { title, url, source: "Test source", provider: "rss", isFallback: false };
}

test("deterministic today brief preserves day/week distinctions and a conditional stance", () => {
  const narrative = buildDeterministicTodayNarrative(
    "es",
    snapshots,
    [article("Mercados globales con mayor amplitud", "https://example.com/global")],
    [article("Bonos argentinos operan firmes", "https://example.com/ar")],
  );

  assert.equal(narrative.tone, "constructive");
  assert.match(narrative.day.summary, /corto plazo/i);
  assert.match(narrative.week.summary, /cinco ruedas/i);
  assert.ok(narrative.recommendedStance.invalidation.length > 20);
  assert.ok(narrative.risks.length >= 2);
});

test("today sources remove duplicate and unusable URLs", () => {
  const sources = todaySources([
    article("Uno", "https://example.com/a"),
    article("Duplicado", "https://example.com/a"),
    article("Sin enlace", "#"),
  ], "international");

  assert.equal(sources.length, 1);
  assert.equal(sources[0].title, "Uno");
});
