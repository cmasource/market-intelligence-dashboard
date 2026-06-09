"use client";

import Link from "next/link";
import { formatDisplayCurrency, formatPercent } from "@/lib/formatters";
import { useLanguage } from "@/lib/i18n/useLanguage";
import type { WatchlistItem } from "@/lib/watchlist";
import { AssetLogo } from "@/components/assets/AssetLogo";

type WatchlistCardProps = {
  item: WatchlistItem;
  price?: number | null;
  changePercent?: number | null;
  sourceLabel?: string | null;
  onRemove: (symbol: string) => void;
};

function formatMaybePrice(value: number | null | undefined, currency: string, language: "en" | "es") {
  if (typeof value !== "number" || !Number.isFinite(value)) return "N/D";
  return new Intl.NumberFormat(language === "es" ? "es-AR" : "en-US", {
    style: "currency",
    currency: currency === "ARS" || currency === "USD" ? currency : "USD",
    maximumFractionDigits: currency === "ARS" ? 0 : 2,
  }).format(value);
}

export function WatchlistCard({ item, price, changePercent, sourceLabel, onRemove }: WatchlistCardProps) {
  const { language } = useLanguage();
  const isPositive = typeof changePercent === "number" && changePercent >= 0;

  return (
    <article className="cma-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <AssetLogo symbol={item.symbol} name={item.name} type={item.assetType} size="sm" />
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-white">{item.symbol}</h2>
            <p className="mt-1 line-clamp-2 text-sm text-slate-300">{item.name}</p>
          </div>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-300">
          {item.market}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{language === "es" ? "Precio" : "Price"}</p>
          <p className="mt-1 text-lg font-semibold text-white">{formatMaybePrice(price, item.currency, language)}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{language === "es" ? "Variacion" : "Change"}</p>
          <p className={`mt-1 text-lg font-semibold ${isPositive ? "text-emerald-300" : "text-rose-300"}`}>
            {typeof changePercent === "number" && Number.isFinite(changePercent) ? formatPercent(changePercent) : "N/D"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-2.5 py-1 text-violet-100">
          {item.assetType.replaceAll("_", " ")}
        </span>
        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-cyan-100">
          {formatDisplayCurrency(item.currency, language)}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-slate-300">
          {sourceLabel ?? (language === "es" ? "Fuente no disponible" : "Source unavailable")}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={`/asset/${encodeURIComponent(item.symbol)}`}
          className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/15"
        >
          {language === "es" ? "Abrir analisis" : "Open analysis"}
        </Link>
        <button
          type="button"
          onClick={() => onRemove(item.symbol)}
          className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-rose-300/40 hover:text-rose-100"
        >
          {language === "es" ? "Quitar de mi lista" : "Remove from watchlist"}
        </button>
      </div>
    </article>
  );
}
