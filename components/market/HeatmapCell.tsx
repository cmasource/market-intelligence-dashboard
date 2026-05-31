"use client";

import Link from "next/link";
import { formatCurrencyValue, formatPercent } from "@/lib/formatters";
import type { FormatterLanguage } from "@/lib/formatters";
import type { HeatmapItem, HeatmapSourceKind } from "@/lib/market/heatmap-types";

type HeatmapCellProps = {
  item: HeatmapItem;
  language: FormatterLanguage;
};

const sourceLabels: Record<HeatmapSourceKind, { en: string; es: string }> = {
  provider: { en: "Provider", es: "Proveedor" },
  yahoo: { en: "Yahoo compatible", es: "Yahoo compatible" },
  manual: { en: "Manual validated", es: "Manual validado" },
  mock: { en: "Simulated", es: "Simulado" },
  future: { en: "Future", es: "Futuro" },
  fallback: { en: "Fallback", es: "Respaldo" },
  unavailable: { en: "N/A", es: "No aplica" },
};

function getCellTone(changePercent: number | null, isSimulated: boolean) {
  if (isSimulated || changePercent === null) {
    return "border-slate-400/20 bg-slate-400/10 text-slate-100 hover:border-slate-200/35";
  }
  if (changePercent >= 2) return "border-emerald-300/40 bg-emerald-400/20 text-emerald-50 hover:border-emerald-100/60";
  if (changePercent > 0.2) return "border-emerald-300/25 bg-emerald-400/12 text-emerald-50 hover:border-emerald-100/45";
  if (changePercent <= -2) return "border-rose-300/40 bg-rose-400/20 text-rose-50 hover:border-rose-100/60";
  if (changePercent < -0.2) return "border-rose-300/25 bg-rose-400/12 text-rose-50 hover:border-rose-100/45";
  return "border-slate-400/20 bg-slate-400/10 text-slate-100 hover:border-cyan-200/40";
}

function getTypeLabel(item: HeatmapItem, language: FormatterLanguage) {
  const labels: Record<string, { en: string; es: string }> = {
    stock: { en: "Equity", es: "Accion" },
    etf: { en: "ETF", es: "ETF" },
    cedear: { en: "CEDEAR", es: "CEDEAR" },
    argentine_equity: { en: "Argentina", es: "Argentina" },
    sovereign_bond: { en: "Bond", es: "Bono" },
    cer_bond: { en: "CER bond", es: "Bono CER" },
    corporate_bond: { en: "Corporate bond", es: "ON" },
    letra: { en: "Bill", es: "Letra" },
    crypto: { en: "Crypto", es: "Cripto" },
  };

  return labels[item.assetType]?.[language] ?? item.typeLabel;
}

export function HeatmapCell({ item, language }: HeatmapCellProps) {
  const source = sourceLabels[item.sourceKind]?.[language] ?? item.sourceLabel;
  const changeLabel = item.changePercent === null ? "N/D" : formatPercent(item.changePercent);
  const priceLabel = typeof item.price === "number" ? formatCurrencyValue(item.price, item.currency, language) : "N/D";

  return (
    <Link
      href={item.href}
      data-testid={`heatmap-cell-${item.symbol}`}
      aria-label={`${item.symbol} ${item.name} ${source}`}
      className={`group min-h-28 rounded-xl border p-3 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,23,42,0.24)] ${getCellTone(
        item.changePercent,
        item.isSimulated,
      )}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold tracking-wide">{item.symbol}</span>
        <span className="rounded-full bg-black/15 px-2 py-0.5 text-xs font-semibold">{changeLabel}</span>
      </div>
      <p className="mt-2 line-clamp-1 text-xs opacity-80">{item.name}</p>
      <p className="mt-3 text-xs font-semibold opacity-95">{priceLabel}</p>
      <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] uppercase tracking-[0.14em]">
        <span className="rounded-full border border-white/15 bg-white/[0.06] px-2 py-0.5 opacity-80">{getTypeLabel(item, language)}</span>
        <span className="rounded-full border border-white/15 bg-white/[0.06] px-2 py-0.5 opacity-80">{source}</span>
      </div>
    </Link>
  );
}
