"use client";

import { useState } from "react";
import type { NewsArticle } from "@/lib/news";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { sanitizeNewsArticle } from "@/lib/news/sanitize-news";
import { orderNewsArticles } from "@/lib/news/order-news";
import { NewsSourceBadge } from "./NewsSourceBadge";

export function NewsList({ articles }: { articles: NewsArticle[] }) {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const cleanArticles = orderNewsArticles(articles.map(sanitizeNewsArticle));

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cleanArticles.map((article, index) => (
        <article key={`${article.title}-${article.url}`} className="overflow-hidden rounded-lg border border-white/10 bg-slate-950/45">
          <NewsImage article={article} index={index} />
          <div className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-white">{article.title}</h3>
              <p className="mt-1 text-xs text-slate-500">
                {isSpanish ? "Fuente" : "Source"}: {article.source}
                {article.publishedAt ? ` | ${new Date(article.publishedAt).toLocaleDateString(isSpanish ? "es-AR" : "en-US")}` : ""}
              </p>
            </div>
            <NewsSourceBadge provider={article.provider} isFallback={article.isFallback} />
          </div>
          {article.summary ? <p className="mt-3 text-sm leading-6 text-slate-400">{article.summary}</p> : null}
          {article.url !== "#" ? (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex text-sm font-medium text-cyan-100 hover:text-cyan-50"
            >
              {isSpanish ? "Abrir noticia" : "Open article"}
            </a>
          ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function NewsImage({ article, index }: { article: NewsArticle; index: number }) {
  const [failed, setFailed] = useState(false);
  if (article.imageUrl && !failed) {
    // eslint-disable-next-line @next/next/no-img-element -- News images are served by many external RSS domains.
    return <img src={article.imageUrl} alt="" loading="lazy" onError={() => setFailed(true)} className="h-36 w-full object-cover" />;
  }
  const tones = ["bg-emerald-950", "bg-cyan-950", "bg-slate-800"];
  return <div className={`flex h-36 items-end p-4 ${tones[index % tones.length]}`}><span className="text-xs font-semibold text-slate-200">{article.source}</span></div>;
}
