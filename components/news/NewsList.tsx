"use client";

import type { NewsArticle } from "@/lib/news";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { sanitizeNewsArticle } from "@/lib/news/sanitize-news";
import { NewsSourceBadge } from "./NewsSourceBadge";

export function NewsList({ articles }: { articles: NewsArticle[] }) {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const cleanArticles = articles.map(sanitizeNewsArticle);

  return (
    <div className="grid gap-3">
      <p className="text-xs leading-5 text-slate-500">
        {isSpanish
          ? "Los titulares pueden mostrarse en el idioma original de la fuente."
          : "Headlines may appear in the source's original language."}
      </p>
      {cleanArticles.map((article) => (
        <article key={`${article.title}-${article.url}`} className="rounded-lg border border-white/10 bg-slate-950/45 p-4">
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
        </article>
      ))}
    </div>
  );
}
