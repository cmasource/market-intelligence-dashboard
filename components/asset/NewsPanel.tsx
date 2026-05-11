"use client";

import { useLanguage } from "@/lib/i18n/useLanguage";
import type { NewsItem } from "@/types/asset";
import { SectionHeader } from "../ui/SectionHeader";

type NewsPanelProps = {
  news: NewsItem[];
};

const sentimentTone: Record<NewsItem["sentiment"], string> = {
  positive: "text-emerald-200 border-emerald-400/30 bg-emerald-500/15",
  neutral: "text-slate-200 border-slate-400/30 bg-slate-500/15",
  negative: "text-rose-200 border-rose-400/30 bg-rose-500/15",
};

export function NewsPanel({ news }: NewsPanelProps) {
  const { t } = useLanguage();
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

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.045] p-5 backdrop-blur">
      <SectionHeader
        eyebrow={t("newsPlaceholder")}
        title={t("marketHeadlines")}
        description={t("newsDescription")}
      />
      <div className="grid gap-3">
        {news.map((item) => (
          <article key={item.title} className="rounded-lg border border-white/10 bg-slate-950/45 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{item.source}</p>
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
            <p className="mt-3 text-sm leading-6 text-slate-400">{item.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
