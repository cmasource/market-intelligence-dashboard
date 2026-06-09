"use client";

import Link from "next/link";
import { AssetLogo } from "@/components/assets/AssetLogo";
import { formatPercent, formatScore } from "@/lib/formatters";
import type { RankingItem } from "@/lib/rankings";

type RankingRowProps = {
  item: RankingItem;
  rank: number;
  accent: "technical" | "fundamental" | "combined" | "performance";
  ctaLabel?: string;
};

const accentClasses = {
  technical: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
  fundamental: "border-violet-300/25 bg-violet-300/10 text-violet-100",
  combined: "border-amber-300/25 bg-amber-300/10 text-amber-100",
  performance: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
};

function getSourceTone(sourceLabel: string, isFallback: boolean) {
  const normalized = sourceLabel.toLowerCase();
  if (!isFallback && (normalized.includes("proveedor") || normalized.includes("provider"))) {
    return "border-cyan-300/20 bg-cyan-300/10 text-cyan-100";
  }
  if (normalized.includes("local") || normalized.includes("manual")) {
    return "border-emerald-300/20 bg-emerald-300/10 text-emerald-100";
  }
  if (isFallback || normalized.includes("fallback") || normalized.includes("simulad")) {
    return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  }
  return "border-white/10 bg-white/[0.035] text-slate-300";
}

export function RankingRow({ item, rank, accent, ctaLabel = "Abrir análisis" }: RankingRowProps) {
  const changeClass = (item.changePercent ?? 0) >= 0 ? "text-emerald-300" : "text-rose-300";

  return (
    <Link
      href={item.route}
      className="group grid gap-3 border-b border-white/7 px-3 py-3 transition last:border-b-0 hover:bg-white/[0.045] sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:items-center"
      data-testid="ranking-row"
    >
      <span className={`grid h-7 w-7 place-items-center rounded-full border text-xs font-semibold ${accentClasses[accent]}`}>
        {rank}
      </span>
      <span className="flex min-w-0 items-start gap-3">
        <AssetLogo symbol={item.symbol} name={item.name} type={item.assetType} size="sm" className="mt-0.5 h-8 w-8 rounded-xl" />
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white">{item.symbol}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[0.68rem] text-slate-300">
              {item.market}
            </span>
            {typeof item.changePercent === "number" ? (
              <span className={`text-xs font-semibold ${changeClass}`}>{formatPercent(item.changePercent)}</span>
            ) : null}
          </span>
          <span className="mt-1 block truncate text-xs text-slate-400">{item.name}</span>
          <span className="mt-1 block text-xs leading-5 text-slate-300">{item.reason}</span>
          <span className="mt-2 flex flex-wrap gap-1.5">
            <span className={`rounded-full border px-2 py-0.5 text-[0.68rem] ${accentClasses[accent]}`}>
              {formatScore(item.score)}
            </span>
            <span className={`rounded-full border px-2 py-0.5 text-[0.68rem] ${getSourceTone(item.sourceLabel, item.isFallback)}`}>
              {item.sourceLabel}
            </span>
          </span>
        </span>
      </span>
      <span className="text-xs font-semibold text-cyan-200 transition group-hover:text-white sm:text-right">{ctaLabel}</span>
    </Link>
  );
}
