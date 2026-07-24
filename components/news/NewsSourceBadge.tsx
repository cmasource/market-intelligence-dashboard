"use client";

import type { NewsArticle } from "@/lib/news";
import { useLanguage } from "@/lib/i18n/useLanguage";

export function NewsSourceBadge({ provider, isFallback }: Pick<NewsArticle, "provider" | "isFallback">) {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const label = provider === "rss"
    ? "RSS"
    : isFallback
      ? (isSpanish ? "Fuente secundaria" : "Secondary source")
      : (isSpanish ? "Fuente externa" : "External source");

  return (
    <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1 text-xs font-medium text-cyan-100">
      {label}
    </span>
  );
}
