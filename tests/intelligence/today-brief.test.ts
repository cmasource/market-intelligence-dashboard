import assert from "node:assert/strict";
import test from "node:test";
import { buildDeterministicTodayNarrative, todayFeaturedNews, todaySources, type TodayMarketSnapshot } from "@/lib/research/today-brief";
import type { NewsArticle } from "@/lib/news";
import { getTodayMarketSessions } from "@/lib/research/market-calendar";

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

test("a US holiday is described as a prior close, not as today's US move", () => {
  const laborDay = getTodayMarketSessions("es", new Date("2026-09-07T14:00:00.000Z"));
  const narrative = buildDeterministicTodayNarrative("es", snapshots, [], [], laborDay);

  assert.equal(laborDay.international.status, "holiday");
  assert.equal(laborDay.international.previousSessionDate, "2026-09-04");
  assert.equal(laborDay.international.nextSessionDate, "2026-09-08");
  assert.match(narrative.deck, /Wall Street está cerrado por feriado/i);
  assert.match(narrative.deck, /última rueda, no a hoy/i);
  assert.doesNotMatch(narrative.deck, /activos internacionales operan/i);
});

test("closed-market headlines do not leak into the daily active-market bullets", () => {
  const laborDay = getTodayMarketSessions("es", new Date("2026-09-07T13:30:00.000Z"));
  const narrative = buildDeterministicTodayNarrative(
    "es",
    snapshots,
    [article("Wall Street cae hoy", "https://example.com/us")],
    [article("El dólar MEP concentra la atención local", "https://example.com/ar")],
    laborDay,
  );

  assert.equal(laborDay.argentina.status, "preopen");
  assert.match(narrative.argentina.summary, /preapertura/i);
  assert.ok(narrative.day.points.some((point) => /dólar MEP/i.test(point)));
  assert.ok(narrative.day.points.every((point) => !/Wall Street cae hoy/i.test(point)));
});

test("the English daily brief does not surface untranslated Argentina headlines", () => {
  const laborDay = getTodayMarketSessions("en", new Date("2026-09-07T14:30:00.000Z"));
  const narrative = buildDeterministicTodayNarrative(
    "en",
    snapshots,
    [],
    [article("El dólar MEP concentra la atención local", "https://example.com/ar")],
    laborDay,
  );

  assert.ok(narrative.day.points.every((point) => !/El dólar/i.test(point)));
  assert.ok(narrative.day.points.some((point) => /local rates/i.test(point)));
});

test("featured news only exposes articles with real publisher images", () => {
  const media = todayFeaturedNews([
    { ...article("Con imagen", "https://example.com/a"), imageUrl: "https://cdn.example.com/news.jpg" },
    article("Sin imagen", "https://example.com/b"),
  ], "international");

  assert.equal(media.length, 1);
  assert.equal(media[0].publisher, "Test source");
  assert.equal(media[0].imageUrl, "https://cdn.example.com/news.jpg");
});

test("deterministic brief refuses a directional stance when every source is unavailable", () => {
  const narrative = buildDeterministicTodayNarrative("es", [], [], []);

  assert.match(narrative.recommendedStance.label, /datos insuficientes/i);
  assert.match(narrative.recommendedStance.rationale, /no hay cotizaciones/i);
  assert.ok(narrative.recommendedStance.actions.some((action) => /ausencia de datos/i.test(action)));
});
