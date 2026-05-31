"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/useLanguage";
import type { NewsArticle, NewsResponse } from "@/lib/news";
import { sanitizeNewsText } from "@/lib/news/sanitize-news";
import type { NewsItem } from "@/types/asset";
import { NewsList } from "../news/NewsList";
import { NewsSourceBadge } from "../news/NewsSourceBadge";
import { SectionHeader } from "../ui/SectionHeader";

type NewsPanelProps = {
  news: NewsItem[];
  symbol?: string;
};

const sentimentTone: Record<NewsItem["sentiment"], string> = {
  positive: "text-emerald-200 border-emerald-400/30 bg-emerald-500/15",
  neutral: "text-slate-200 border-slate-400/30 bg-slate-500/15",
  negative: "text-rose-200 border-rose-400/30 bg-rose-500/15",
};

function fallbackArticles(news: NewsItem[], symbol?: string): NewsArticle[] {
  return news.map((item) => ({
    title: sanitizeNewsText(item.title, 180),
    source: sanitizeNewsText(item.source, 80),
    url: "#",
    summary: sanitizeNewsText(item.summary, 240),
    relatedSymbols: symbol ? [symbol] : undefined,
    provider: "mock",
    isFallback: true,
  }));
}

export function NewsPanel({ news, symbol }: NewsPanelProps) {
  const { t, language } = useLanguage();
  const isSpanish = language === "es";
  const [response, setResponse] = useState<NewsResponse | null>(null);
  const sentimentLabels: Record<NewsItem["sentiment"], string> = {
    positive: t("sentimentPositive"),
    neutral: t("sentimentNeutral"),
    negative: t("sentimentNegative"),
  };
  const impactLabels: Record<NewsItem["impact"], string> = {
    low: t("impactLow"),
    medium: t("impactMedium"),
    high: t("impactHigh"),
  };
  const fallback = fallbackArticles(news, symbol);

  useEffect(() => {
    if (!symbol) return;
    let active = true;

    async function load() {
      try {
        const newsResponse = await fetch(`/api/news/${encodeURIComponent(symbol ?? "")}`);
        if (!active || !newsResponse.ok) return;
        setResponse(await newsResponse.json());
      } catch {
        if (active) setResponse(null);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [symbol]);

  const providerResponse = response?.articles?.length ? response : null;
  const providerArticles = providerResponse?.articles ?? null;

  return (
    <section className="cma-card-news p-5" data-testid="news-panel">
      <SectionHeader
        eyebrow={t("newsPlaceholder")}
        title={t("marketHeadlines")}
        description={t("newsDescription")}
      />
      {providerResponse ? (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <NewsSourceBadge provider={providerResponse.provider} isFallback={providerResponse.isFallback} />
            <span className="text-xs text-slate-500">{providerResponse.sourceLabel}</span>
          </div>
          <p className="mb-3 text-xs text-slate-500">
            {isSpanish
              ? "Los titulares pueden mostrarse en el idioma original de la fuente."
              : "Headlines may appear in the source's original language."}
          </p>
          <NewsList articles={providerResponse.articles} />
        </>
      ) : (
      <div className="grid gap-3">
        {news.map((item) => (
          <article key={item.title} className="rounded-lg border border-white/10 bg-slate-950/45 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-white">{sanitizeNewsText(item.title, 180)}</h3>
                <p className="mt-1 text-xs text-slate-500">{sanitizeNewsText(item.source, 80)}</p>
              </div>
              <div className="flex gap-2">
                <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${sentimentTone[item.sentiment]}`}>
                  {sentimentLabels[item.sentiment]}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-xs text-slate-300">
                  {t("impact", { impact: impactLabels[item.impact] })}
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">{sanitizeNewsText(item.summary, 240)}</p>
            <span className="mt-3 inline-flex text-sm font-medium text-cyan-100">
              {isSpanish ? "Abrir noticia" : "Open article"}
            </span>
          </article>
        ))}
      </div>
      )}
      {!providerArticles && fallback.length ? (
        <p className="mt-3 text-xs text-slate-500">
          {fallback[0].provider === "mock" ? "Mock news if fallback" : ""}
        </p>
      ) : null}
    </section>
  );
}
