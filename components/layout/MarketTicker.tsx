"use client";

import { useEffect, useMemo, useState } from "react";

type TickerItem = {
  id: string;
  label: string;
  value: number | null;
  changePercent: number | null;
  currency: string;
  source: string;
  updatedAt: string | null;
  status: "ok" | "unavailable";
};

type TickerResponse = {
  items: TickerItem[];
  fetchedAt: string;
  sources: string[];
};

function formatValue(item: TickerItem) {
  if (typeof item.value !== "number" || !Number.isFinite(item.value)) return "N/D";
  const maximumFractionDigits = item.value >= 1000 ? 0 : 2;
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits,
    minimumFractionDigits: item.value >= 1000 ? 0 : 2,
  }).format(item.value);
}

function formatChange(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function MarketTicker() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTicker() {
      try {
        const response = await fetch("/api/market-ticker", { signal: controller.signal });
        if (!response.ok) throw new Error(`Ticker API returned HTTP ${response.status}.`);
        const data = (await response.json()) as TickerResponse;
        if (!controller.signal.aborted) setItems(data.items);
      } catch {
        if (!controller.signal.aborted) setItems([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadTicker();
    const interval = window.setInterval(loadTicker, 60_000);

    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  const tapeItems = useMemo(() => (items.length ? [...items, ...items] : []), [items]);

  if (loading) {
    return <div className="h-8 flex-1 rounded-md border border-white/10 bg-slate-950/40" aria-label="Cargando referencias de mercado" />;
  }

  if (!tapeItems.length) {
    return (
      <div className="flex h-8 flex-1 items-center rounded-md border border-amber-300/20 bg-amber-300/10 px-3 text-xs font-medium text-amber-200">
        Referencias de mercado no disponibles
      </div>
    );
  }

  return (
    <div className="cma-market-tape" aria-label="Referencias de mercado">
      <div className="cma-market-tape-track">
        {tapeItems.map((item, index) => {
          const change = formatChange(item.changePercent);
          const isPositive = typeof item.changePercent === "number" && item.changePercent >= 0;

          return (
            <span className="cma-market-tape-item" key={`${item.id}-${index}`}>
              <span className="font-semibold text-slate-100">{item.label}</span>
              <span className="font-semibold tabular-nums text-white">{formatValue(item)}</span>
              <span className="text-[var(--cma-text-muted)]">{item.currency}</span>
              {change ? (
                <span className={isPositive ? "text-emerald-300" : "text-rose-300"}>{change}</span>
              ) : null}
            </span>
          );
        })}
      </div>
    </div>
  );
}
