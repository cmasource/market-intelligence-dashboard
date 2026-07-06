"use client";

import type { TradeRadarProviderStatus } from "@/lib/market-data/trade-radar-provider-status";

type ProviderStatusPanelProps = {
  status: TradeRadarProviderStatus | null;
};

function statusBadge(active: boolean) {
  return active
    ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
    : "border-amber-300/30 bg-amber-300/10 text-amber-100";
}

export function ProviderStatusPanel({ status }: ProviderStatusPanelProps) {
  return (
    <section className="grid gap-3 rounded-lg border border-white/10 bg-slate-950/45 p-4 text-sm sm:grid-cols-3">
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-white">Datos US</p>
          <span className={`rounded-full border px-2 py-0.5 text-xs ${statusBadge(Boolean(status?.hasTwelveDataKey || status?.hasAlphaVantageKey))}`}>
            {status?.hasTwelveDataKey || status?.hasAlphaVantageKey ? "ok" : "falta key"}
          </span>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">Requiere Twelve Data o Alpha Vantage.</p>
      </div>
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-white">Fundamentales</p>
          <span className={`rounded-full border px-2 py-0.5 text-xs ${statusBadge(Boolean(status?.hasFmpKey))}`}>
            {status?.hasFmpKey ? "ok" : "falta key"}
          </span>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">Requiere FMP. No es proveedor principal OHLCV.</p>
      </div>
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-white">Argentina local</p>
          <span className={`rounded-full border px-2 py-0.5 text-xs ${statusBadge(Boolean(status?.hasBymaKey))}`}>
            {status?.hasBymaKey ? "ok" : "falta key"}
          </span>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          Requiere OAuth BYMA. Feed: {status?.byma.defaultFeed ?? "delay20"}. Crypto usa {status?.binanceBaseUrl ?? "Binance"}.
        </p>
      </div>
    </section>
  );
}
