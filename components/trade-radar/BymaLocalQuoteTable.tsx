"use client";

import type { BymaQuote } from "@/lib/market-data/providers/base";

type BymaLocalQuoteTableProps = {
  quote: BymaQuote;
};

function formatNumber(value: number | null) {
  if (value === null) return "-";
  return value.toLocaleString("es-AR", { maximumFractionDigits: 4 });
}

function formatText(value: string | null) {
  return value?.trim() || "-";
}

export function BymaLocalQuoteTable({ quote }: BymaLocalQuoteTableProps) {
  const rows = [
    ["Simbolo", quote.symbol],
    ["Security ID", quote.securityId],
    ["Ultimo precio", formatNumber(quote.lastPrice)],
    ["Apertura", formatNumber(quote.open)],
    ["Maximo", formatNumber(quote.high)],
    ["Minimo", formatNumber(quote.low)],
    ["Cierre previo", formatNumber(quote.previousClose)],
    ["Volumen", formatNumber(quote.volume)],
    ["Monto", formatNumber(quote.amount)],
    ["Bid", formatNumber(quote.bestBid)],
    ["Ask", formatNumber(quote.bestAsk)],
    ["Moneda", quote.currency],
    ["Plazo", quote.settlPeriod],
    ["Fecha", quote.date],
    ["Hora broadcast", quote.broadcastTime],
  ];

  return (
    <section className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">BYMA local</p>
          <h3 className="mt-1 text-lg font-semibold text-white">Cotizacion local</h3>
        </div>
        <span className="w-fit rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
          BYMA {quote.feed === "delay20" ? "Delay20" : quote.feed === "snapshot" ? "Snapshot" : "EOD"}
        </span>
      </div>
      <div className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-slate-950/45">
        <table className="w-full min-w-[620px] text-left text-sm">
          <tbody className="divide-y divide-white/10">
            {rows.map(([label, value]) => (
              <tr key={label}>
                <th className="w-56 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {label}
                </th>
                <td className="px-4 py-3 font-mono text-slate-200">{typeof value === "string" ? formatText(value) : value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
