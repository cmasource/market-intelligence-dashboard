type MetricGridItem = {
  label: string;
  value: string;
};

type MetricGridProps = {
  items: MetricGridItem[];
};

export function MetricGrid({ items }: MetricGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-white/10 bg-slate-950/45 p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
          <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
