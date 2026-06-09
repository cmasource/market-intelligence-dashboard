"use client";

import { useEffect, useState } from "react";
import { addWatchlistItem, isInWatchlist, removeWatchlistItem, WATCHLIST_UPDATED_EVENT, type WatchlistInput } from "@/lib/watchlist";
import { useLanguage } from "@/lib/i18n/useLanguage";

type WatchlistButtonProps = {
  item: WatchlistInput;
  compact?: boolean;
  className?: string;
};

export function WatchlistButton({ item, compact = false, className = "" }: WatchlistButtonProps) {
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    const sync = () => setSaved(isInWatchlist(item.symbol));
    queueMicrotask(() => {
      if (!active) return;
      setMounted(true);
      sync();
    });
    window.addEventListener(WATCHLIST_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      active = false;
      window.removeEventListener(WATCHLIST_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [item.symbol]);

  const label = saved
    ? language === "es"
      ? "Quitar de mi lista"
      : "Remove from watchlist"
    : language === "es"
      ? "Agregar a mi lista"
      : "Add to watchlist";

  return (
    <button
      type="button"
      disabled={!mounted}
      aria-pressed={saved}
      data-testid={`watchlist-button-${item.symbol}`}
      onClick={() => {
        if (saved) {
          removeWatchlistItem(item.symbol);
          setSaved(false);
        } else {
          addWatchlistItem(item);
          setSaved(true);
        }
      }}
      className={`inline-flex items-center justify-center rounded-full border transition disabled:cursor-wait disabled:opacity-60 ${
        compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
      } ${
        saved
          ? "border-amber-300/35 bg-amber-300/10 text-amber-100 hover:bg-amber-300/15"
          : "border-cyan-300/30 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/15"
      } ${className}`}
    >
      {compact ? (saved ? (language === "es" ? "Guardado" : "Saved") : language === "es" ? "Mi lista" : "Watchlist") : label}
    </button>
  );
}
