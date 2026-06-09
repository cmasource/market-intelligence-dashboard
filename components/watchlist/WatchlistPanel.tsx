"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useArgentinaQuotes } from "@/lib/hooks/useArgentinaQuotes";
import { useProviderQuotes } from "@/lib/hooks/useProviderQuotes";
import { isArgentinaInstrument } from "@/lib/argentina";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { isProviderQuoteSupported } from "@/lib/market-data/provider-symbols";
import { clearWatchlist, readWatchlist, removeWatchlistItem, WATCHLIST_UPDATED_EVENT, type WatchlistItem } from "@/lib/watchlist";
import { WatchlistCard } from "./WatchlistCard";

export function WatchlistPanel() {
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<WatchlistItem[]>([]);

  useEffect(() => {
    let active = true;
    const sync = () => setItems(readWatchlist());
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
  }, []);

  const providerSymbols = useMemo(() => items.map((item) => item.symbol).filter((symbol) => isProviderQuoteSupported(symbol)), [items]);
  const argentinaSymbols = useMemo(() => items.map((item) => item.symbol).filter((symbol) => isArgentinaInstrument(symbol)), [items]);
  const providerQuotes = useProviderQuotes(providerSymbols);
  const argentinaQuotes = useArgentinaQuotes(argentinaSymbols);

  const quoteFor = (symbol: string) => {
    const argentinaQuote = argentinaQuotes[symbol];
    if (argentinaQuote) {
      return {
        price: argentinaQuote.price,
        changePercent: argentinaQuote.changePercent,
        sourceLabel: argentinaQuote.sourceLabel,
      };
    }
    const providerQuote = providerQuotes[symbol];
    if (providerQuote) {
      return {
        price: providerQuote.price,
        changePercent: providerQuote.changePercent,
        sourceLabel: providerQuote.sourceLabel ?? providerQuote.provider,
      };
    }
    return { price: null, changePercent: null, sourceLabel: null };
  };

  if (!mounted) {
    return (
      <div className="cma-panel p-6 text-sm text-slate-400">
        {language === "es" ? "Cargando lista local..." : "Loading local watchlist..."}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="cma-panel-elevated p-8">
        <h2 className="text-2xl font-semibold text-white">{language === "es" ? "Sin activos guardados" : "No saved assets"}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
          {language === "es"
            ? "Lista local guardada en este navegador. No requiere cuenta y no se sincroniza entre dispositivos."
            : "A local list saved in this browser. It does not require an account and does not sync across devices."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/screener" className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100">
            {language === "es" ? "Ir al screener" : "Open screener"}
          </Link>
          <Link href="/markets#market-heatmap" className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300">
            {language === "es" ? "Ver heatmap" : "View heatmap"}
          </Link>
          <Link href="/argentina" className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300">
            {language === "es" ? "Ver Argentina" : "View Argentina"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-300">
          {language === "es" ? `${items.length} activos seguidos` : `${items.length} watched assets`}
        </p>
        <button
          type="button"
          onClick={() => {
            clearWatchlist();
            setItems([]);
          }}
          className="self-start rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-rose-300/40 hover:text-rose-100 sm:self-auto"
        >
          {language === "es" ? "Limpiar lista" : "Clear watchlist"}
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const quote = quoteFor(item.symbol);
          return (
            <WatchlistCard
              key={item.symbol}
              item={item}
              price={quote.price}
              changePercent={quote.changePercent}
              sourceLabel={quote.sourceLabel}
              onRemove={(symbol) => {
                setItems(removeWatchlistItem(symbol));
              }}
            />
          );
        })}
      </div>
    </section>
  );
}
