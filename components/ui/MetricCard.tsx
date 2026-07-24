type MetricCardProps = {
  label: string;
  value: string;
  change?: string;
  context?: string;
  trend?: string;
  tone?: "positive" | "negative" | "neutral";
};

const toneClasses = {
  positive: "text-emerald-400",
  negative: "text-rose-400",
  neutral: "text-slate-400",
};

export function MetricCard({ label, value, change, context, trend, tone = "neutral" }: MetricCardProps) {
  return (
    <article className="cma-card-price p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-400">{label}</p>
        {change ? <span className={`text-xs font-semibold ${toneClasses[tone]}`}>{change}</span> : null}
      </div>
      <p className="cma-metric mt-3 text-2xl font-semibold tracking-tight text-white">{value}</p>
      {trend ? <p className={`mt-2 text-xs font-medium ${toneClasses[tone]}`}>{trend}</p> : null}
      {context ? <p className="mt-2 text-xs leading-5 text-slate-500">{context}</p> : null}
    </article>
  );
}
