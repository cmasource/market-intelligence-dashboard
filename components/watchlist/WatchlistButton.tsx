"use client";

import { useEffect, useMemo, useState } from "react";
import { ListPlus } from "lucide-react";
import { AddToWatchlistDialog } from "./AddToWatchlistDialog";
import { WATCHLIST_UPDATED_EVENT, buildWatchlistAssetKey, getWatchlistRepository, type WatchlistInput } from "@/lib/watchlist";
import { useLanguage } from "@/lib/i18n/useLanguage";

type WatchlistButtonProps = {
  item: WatchlistInput;
  compact?: boolean;
  className?: string;
};

export function WatchlistButton({ item, compact = false, className = "" }: WatchlistButtonProps) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [membershipCount, setMembershipCount] = useState(0);
  const assetKey = useMemo(() => buildWatchlistAssetKey(item), [item]);

  useEffect(() => {
    let active = true;
    const sync = async () => {
      const memberships = await getWatchlistRepository().getMemberships(assetKey);
      if (active) { setMembershipCount(memberships.length); setMounted(true); }
    };
    void sync();
    window.addEventListener(WATCHLIST_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      active = false;
      window.removeEventListener(WATCHLIST_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [assetKey]);

  const label = membershipCount
    ? language === "es" ? `En ${membershipCount} ${membershipCount === 1 ? "lista" : "listas"}` : `In ${membershipCount} lists`
    : language === "es" ? "Agregar a lista" : "Add to watchlist";

  return (
    <>
      <button
        type="button"
        disabled={!mounted}
        aria-haspopup="dialog"
        data-testid={`watchlist-button-${item.symbol}`}
        onClick={() => setOpen(true)}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border transition disabled:cursor-wait disabled:opacity-60 ${
          compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
        } ${membershipCount ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-100" : "border-cyan-300/30 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/15"} ${className}`}
      >
        <ListPlus size={compact ? 14 : 16} aria-hidden="true" />
        {label}
      </button>
      <AddToWatchlistDialog open={open} item={item} onClose={() => setOpen(false)} />
    </>
  );
}
