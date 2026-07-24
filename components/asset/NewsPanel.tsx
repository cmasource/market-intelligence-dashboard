"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/useLanguage";
import type { NewsResponse } from "@/lib/news";
import { NewsList } from "../news/NewsList";
import { NewsSourceBadge } from "../news/NewsSourceBadge";
import { SectionHeader } from "../ui/SectionHeader";

export function NewsPanel({ symbol }: { symbol?: string }) {
  const { t, language } = useLanguage();
  const isSpanish = language === "es";
  const [response, setResponse] = useState<NewsResponse | null>(null);

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
          </div>
          <p className="mb-3 text-xs text-slate-500">
            {isSpanish
              ? "Los titulares pueden mostrarse en el idioma original de la fuente."
              : "Headlines may appear in the source's original language."}
          </p>
          <NewsList articles={providerResponse.articles} />
        </>
      ) : (
        <div className="rounded-lg border border-white/10 bg-slate-950/35 p-4 text-sm leading-6 text-slate-400">
          {isSpanish
            ? "No hay noticias verificadas disponibles para este activo en este momento."
            : "No verified news is available for this asset right now."}
        </div>
      )}
    </section>
  );
}
