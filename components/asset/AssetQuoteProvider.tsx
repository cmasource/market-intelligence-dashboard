"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ArgentinaQuote } from "@/lib/argentina";
import type { MarketQuoteResponse } from "@/lib/market-data/types";

type AssetQuoteContextValue = {
  quote: ArgentinaQuote | MarketQuoteResponse | null;
  loading: boolean;
  error: string | null;
  isArgentina: boolean;
};

const AssetQuoteContext = createContext<AssetQuoteContextValue | null>(null);

export function AssetQuoteProvider({
  symbol,
  instrumentId,
  isArgentina,
  children,
}: {
  symbol: string;
  instrumentId?: string;
  isArgentina: boolean;
  children: ReactNode;
}) {
  const [quote, setQuote] = useState<ArgentinaQuote | MarketQuoteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let controller: AbortController | null = null;

    async function loadQuote(showLoading = false) {
      controller?.abort();
      const requestController = new AbortController();
      controller = requestController;
      if (showLoading) setLoading(true);
      try {
        const quoteParams = new URLSearchParams();
        if (instrumentId) quoteParams.set("instrumentId", instrumentId);
        const query = quoteParams.size > 0 ? `?${quoteParams.toString()}` : "";
        const endpoint = isArgentina
          ? `/api/argentina/quote/${encodeURIComponent(symbol)}`
          : `/api/market-data/quote/${encodeURIComponent(symbol)}${query}`;
        const response = await fetch(endpoint, { cache: "no-store", signal: requestController.signal });
        if (!response.ok) throw new Error(`Quote API returned HTTP ${response.status}.`);
        const nextQuote = (await response.json()) as ArgentinaQuote | MarketQuoteResponse;
        if (active && !requestController.signal.aborted) {
          setQuote(nextQuote);
          setError("error" in nextQuote ? nextQuote.error ?? null : null);
        }
      } catch (requestError) {
        if (active && !(requestError instanceof DOMException && requestError.name === "AbortError")) {
          setError(requestError instanceof Error ? requestError.message : "Quote request failed.");
        }
      } finally {
        if (active && !requestController.signal.aborted) setLoading(false);
      }
    }

    void loadQuote(true);
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadQuote();
    }, 30_000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void loadQuote();
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      active = false;
      controller?.abort();
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [instrumentId, isArgentina, symbol]);

  const value = useMemo(() => ({ quote, loading, error, isArgentina }), [error, isArgentina, loading, quote]);
  return <AssetQuoteContext.Provider value={value}>{children}</AssetQuoteContext.Provider>;
}

export function useAssetQuote() {
  const context = useContext(AssetQuoteContext);
  if (!context) throw new Error("useAssetQuote must be used inside AssetQuoteProvider.");
  return context;
}
