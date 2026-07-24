"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/useLanguage";

type TickerItem = {
  id: string;
  label: string;
  value: number | null;
  changePercent: number | null;
  currency: string;
};

function formatValue(item: TickerItem) {
  if (typeof item.value !== "number") return "-";
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: item.value >= 1000 ? 0 : 2 }).format(item.value);
}

export function MarketPulseVisual() {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const [items, setItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/market-ticker", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { items?: TickerItem[] } | null) => setItems(payload?.items ?? []))
      .catch(() => setItems([]));
    return () => controller.abort();
  }, []);

  const visible = useMemo(
    () => items.filter((item) => ["merval", "sp500", "nasdaq", "usd-bolsa"].includes(item.id)).slice(0, 4),
    [items],
  );
  return (
    <div className="mt-7 overflow-hidden rounded-lg border border-emerald-300/20 bg-slate-950/65">
      <div className="flex items-center justify-between gap-4 px-4 pt-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
            {isSpanish ? "Pulso de mercado" : "Market pulse"}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {isSpanish ? "Indices y dolar financiero" : "Indices and financial dollar"}
          </p>
        </div>
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" aria-hidden="true" />
      </div>
      <div className="mt-4 grid grid-cols-2 border-t border-white/8 sm:grid-cols-4">
        {(visible.length ? visible : Array.from({ length: 4 }, (_, index) => ({ id: `loading-${index}`, label: "", value: null, changePercent: null, currency: "" }))).map((item) => {
          const change = item.changePercent;
          const positive = typeof change === "number" && change >= 0;
          return (
            <div key={item.id} className="min-h-20 border-b border-r border-white/8 bg-white/[0.025] px-3 py-3 last:border-r-0 sm:border-b-0">
              {item.label ? (
                <>
                  <span className="block truncate text-xs font-semibold text-slate-400">{item.label}</span>
                  <span className="mt-1 block text-base font-semibold tabular-nums text-white">{formatValue(item)} <small className="text-[10px] font-normal text-slate-500">{item.currency}</small></span>
                  <span className={`mt-1 block text-xs font-semibold ${positive ? "text-emerald-300" : "text-rose-300"}`}>
                    {typeof change === "number" ? `${change > 0 ? "+" : ""}${change.toFixed(2)}%` : "-"}
                  </span>
                </>
              ) : (
                <div className="h-10 animate-pulse rounded bg-white/[0.05]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
