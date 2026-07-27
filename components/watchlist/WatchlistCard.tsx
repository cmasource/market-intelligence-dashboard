"use client";

import Link from "next/link";
import { Copy, ExternalLink, MoveRight, Trash2 } from "lucide-react";
import { AssetLogo } from "@/components/assets/AssetLogo";
import { formatPercent } from "@/lib/formatters";
import type { Watchlist, WatchlistItem } from "@/lib/watchlist";

type WatchlistCardProps = {
  item: WatchlistItem;
  lists: Watchlist[];
  activeListId: string;
  memberships: string[];
  price?: number | null;
  changePercent?: number | null;
  currency?: string | null;
  updatedAt?: string | null;
  loading?: boolean;
  onRemove: () => void;
  onMove: (targetId: string) => void;
  onCopy: (targetId: string) => void;
};

function formatPrice(value: number | null | undefined, currency: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Dato no disponible";
  try {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: currency === "ARS" ? 0 : 2 }).format(value);
  } catch { return value.toLocaleString("es-AR"); }
}

export function WatchlistCard({ item, lists, activeListId, memberships, price, changePercent, currency, updatedAt, loading, onRemove, onMove, onCopy }: WatchlistCardProps) {
  const destinations = lists.filter((list) => list.id !== activeListId);
  const positive = typeof changePercent === "number" && changePercent >= 0;
  const tradeRadarHref = `/trade-radar?symbol=${encodeURIComponent(item.symbol)}${item.instrumentId ? `&instrumentId=${encodeURIComponent(item.instrumentId)}` : ""}`;

  return (
    <article className="cma-panel p-4" data-testid="watchlist-asset-row">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 gap-3">
          <AssetLogo symbol={item.symbol} name={item.name} type={item.assetType} size="sm" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-mono text-lg font-semibold text-[var(--cma-text-primary)]">{item.displaySymbol}</h3>
              <span className="rounded-full border border-[var(--cma-border-soft)] px-2 py-0.5 text-[0.68rem] text-[var(--cma-text-muted)]">{item.assetType.replaceAll("_", " ")}</span>
            </div>
            <p className="mt-1 text-sm text-[var(--cma-text-secondary)]">{item.name}</p>
            <p className="mt-1 text-xs text-[var(--cma-text-muted)]">{item.exchange || item.market} · {item.currency}</p>
          </div>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-x-5 gap-y-1 text-right sm:min-w-64">
          <span className="text-xs text-[var(--cma-text-muted)]">Precio</span>
          <span className="text-xs text-[var(--cma-text-muted)]">Variación diaria</span>
          <span className="text-sm font-semibold text-[var(--cma-text-primary)]">{loading ? "Cargando..." : formatPrice(price, currency || item.currency)}</span>
          <span className={`text-sm font-semibold ${typeof changePercent !== "number" ? "text-[var(--cma-text-muted)]" : positive ? "text-[var(--cma-positive)]" : "text-[var(--cma-negative)]"}`}>
            {typeof changePercent === "number" ? formatPercent(changePercent) : "Dato no disponible"}
          </span>
          <span className="col-span-2 mt-1 text-xs text-[var(--cma-text-muted)]">Actualizado: {updatedAt ? new Date(updatedAt).toLocaleString("es-AR") : "Dato no disponible"}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-[var(--cma-border-soft)] pt-4 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-xs text-[var(--cma-text-muted)]">También en: {memberships.length ? memberships.join(", ") : "ninguna otra lista"}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={tradeRadarHref} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 text-sm font-medium text-cyan-100">
            <ExternalLink size={15} aria-hidden="true" /> Abrir en Trade Radar
          </Link>
          {destinations.length ? (
            <details className="relative">
              <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-lg border border-[var(--cma-border-soft)] px-3 text-sm text-[var(--cma-text-secondary)]">Mover o copiar</summary>
              <div className="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] p-2 shadow-xl">
                {destinations.map((list) => (
                  <div key={list.id} className="flex items-center justify-between gap-2 rounded-md px-2 py-2 hover:bg-white/[0.035]">
                    <span className="min-w-0 truncate text-sm text-[var(--cma-text-primary)]">{list.name}</span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => onCopy(list.id)} aria-label={`Copiar a ${list.name}`} className="grid min-h-11 min-w-11 place-items-center rounded-md border border-[var(--cma-border-soft)]"><Copy size={15} aria-hidden="true" /></button>
                      <button type="button" onClick={() => onMove(list.id)} aria-label={`Mover a ${list.name}`} className="grid min-h-11 min-w-11 place-items-center rounded-md border border-[var(--cma-border-soft)]"><MoveRight size={15} aria-hidden="true" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ) : null}
          <button type="button" onClick={onRemove} aria-label={`Quitar ${item.displaySymbol} de esta lista`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--cma-border-soft)] px-3 text-sm text-[var(--cma-text-secondary)] hover:border-rose-300/40 hover:text-rose-200">
            <Trash2 size={15} aria-hidden="true" /> Quitar
          </button>
        </div>
      </div>
    </article>
  );
}
