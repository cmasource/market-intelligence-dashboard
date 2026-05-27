"use client";

import { useTheme } from "@/lib/theme/useTheme";

type MetricCardProps = {
  label: string;
  value: string;
  change?: string;
  context?: string;
  trend?: string;
  tone?: "positive" | "negative" | "neutral";
};

const toneClasses = {
  positive: "text-emerald-300",
  negative: "text-rose-300",
  neutral: "text-slate-300",
};

export function MetricCard({ label, value, change, context, trend, tone = "neutral" }: MetricCardProps) {
  const { resolvedMode } = useTheme();
  const isLight = resolvedMode === "light";

  return (
    <article
      className={`cma-card-price p-4 backdrop-blur ${
        isLight
          ? "bg-white shadow-lg shadow-slate-900/10"
          : "bg-white/[0.045] shadow-2xl shadow-black/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-300">{label}</p>
        {change ? <span className={`text-xs font-semibold ${toneClasses[tone]}`}>{change}</span> : null}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</p>
      {trend ? <p className={`mt-2 text-xs font-medium ${toneClasses[tone]}`}>{trend}</p> : null}
      {context ? <p className="mt-2 text-xs leading-5 text-slate-400">{context}</p> : null}
    </article>
  );
}
