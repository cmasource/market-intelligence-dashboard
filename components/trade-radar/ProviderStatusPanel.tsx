"use client";

import type { TradeRadarProviderStatus } from "@/lib/market-data/trade-radar-provider-status";

type ProviderStatusPanelProps = {
  status: TradeRadarProviderStatus | null;
};

export function ProviderStatusPanel({ status }: ProviderStatusPanelProps) {
  return (
    <section className="grid gap-3 rounded-lg border border-white/10 bg-slate-950/45 p-4 text-sm sm:grid-cols-3">
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-white">Mercado global</p>
          <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-0.5 text-xs text-emerald-100">operativo</span>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">Historial OHLCV público para acciones, ETFs, ADRs y subyacentes de CEDEARs.</p>
      </div>
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-white">Mercado argentino</p>
          <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-0.5 text-xs text-emerald-100">operativo</span>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          Históricos locales, ADRs o subyacentes según el instrumento. Cotización BYMA directa {status?.hasBymaKey ? "activa" : "sujeta a disponibilidad"}.
        </p>
      </div>
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-white">Cripto</p>
          <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-0.5 text-xs text-emerald-100">operativo</span>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">Velas OHLCV públicas y análisis técnico calculado con la misma metodología del resto del sitio.</p>
      </div>
    </section>
  );
}
