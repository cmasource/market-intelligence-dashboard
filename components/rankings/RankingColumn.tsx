"use client";

import type { RankingItem } from "@/lib/rankings";
import { RankingRow } from "./RankingRow";

type RankingColumnProps = {
  title: string;
  subtitle: string;
  items: RankingItem[];
  accent: "technical" | "fundamental" | "combined";
  ctaLabel?: string;
  compact?: boolean;
};

const titleAccent = {
  technical: "text-cyan-200",
  fundamental: "text-violet-200",
  combined: "text-amber-200",
};

export function RankingColumn({ title, subtitle, items, accent, ctaLabel, compact = false }: RankingColumnProps) {
  return (
    <article className="w-[84vw] max-w-sm shrink-0 snap-start overflow-hidden rounded-lg border border-white/10 bg-slate-950/55 shadow-2xl shadow-black/10 xl:w-auto xl:max-w-none">
      <div className="border-b border-white/10 p-4">
        <h3 className={`text-lg font-semibold ${titleAccent[accent]}`}>{title}</h3>
        {!compact ? <p className="mt-2 text-xs leading-5 text-slate-400">{subtitle}</p> : null}
      </div>
      <div>
        {items.map((item, index) => (
          <RankingRow key={item.symbol} item={item} rank={index + 1} accent={accent} ctaLabel={ctaLabel} compact={compact} />
        ))}
      </div>
    </article>
  );
}
