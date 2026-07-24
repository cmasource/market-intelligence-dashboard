"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/useLanguage";
import type { NewsArticle, NewsResponse } from "@/lib/news/types";

function formatDate(value: string | undefined, language: "en" | "es") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(language === "es" ? "es-AR" : "en-US", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function newsTone(index: number) {
  const tones = [
    "from-emerald-400/28 via-cyan-300/15 to-slate-950",
    "from-amber-300/26 via-emerald-300/12 to-slate-950",
    "from-cyan-300/24 via-violet-300/10 to-slate-950",
  ];
  return tones[index % tones.length];
}

function NewsVisual({ article, index }: { article: NewsArticle; index: number }) {
  const [hasImageError, setHasImageError] = useState(false);

  if (article.imageUrl && !hasImageError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- RSS images come from multiple external news domains.
      <img
        src={article.imageUrl}
        alt=""
        className="h-36 w-full object-cover"
        loading="lazy"
        onError={() => setHasImageError(true)}
      />
    );
  }

  return (
    <div className={`grid h-36 place-items-end bg-gradient-to-br ${newsTone(index)} p-4`}>
      <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs font-semibold text-slate-100">
        {article.source}
      </span>
    </div>
  );
}

export function MarketNewsPreview() {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const [response, setResponse] = useState<NewsResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/news/market", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: NewsResponse | null) => {
        if (!cancelled) setResponse(payload);
      })
      .catch(() => {
        if (!cancelled) setResponse(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const articles = useMemo<NewsArticle[]>(() => response?.articles.slice(0, 3) ?? [], [response]);

  return (
    <section className="cma-panel p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="cma-kicker">{isSpanish ? "Noticias de mercado" : "Market news"}</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {isSpanish ? "Pulso argentino y global" : "Argentina and global pulse"}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            {isSpanish
              ? "Titulares recientes de economia y mercados para acompanar la lectura tecnica y fundamental."
              : "Recent economy and market headlines to support the technical and fundamental view."}
          </p>
        </div>
        <a href="/reports" className="text-sm font-semibold text-cyan-200 transition hover:text-white">
          {isSpanish ? "Abrir reportes" : "Open reports"}
        </a>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {articles.length ? (
          articles.map((article, index) => {
            const dateLabel = formatDate(article.publishedAt, language);
            return (
              <a
                key={`${article.url}-${index}`}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden rounded-lg border border-white/10 bg-slate-950/55 transition hover:-translate-y-0.5 hover:border-cyan-200/35"
              >
                <NewsVisual article={article} index={index} />
                <div className="p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    {article.source}
                    {dateLabel ? ` | ${dateLabel}` : ""}
                  </p>
                  <h3 className="mt-2 line-clamp-3 text-base font-semibold leading-6 text-white group-hover:text-cyan-100">
                    {article.title}
                  </h3>
                  {article.summary ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">{article.summary}</p> : null}
                </div>
              </a>
            );
          })
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-400 lg:col-span-3">
            {isSpanish ? "Noticias no disponibles en este momento." : "News unavailable right now."}
          </div>
        )}
      </div>
    </section>
  );
}
