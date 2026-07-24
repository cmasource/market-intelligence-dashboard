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
  isArgentina,
  children,
}: {
  symbol: string;
  isArgentina: boolean;
  children: ReactNode;
}) {
  const [quote, setQuote] = useState<ArgentinaQuote | MarketQuoteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadQuote() {
      setLoading(true);
      setError(null);
      try {
        const endpoint = isArgentina
          ? `/api/argentina/quote/${encodeURIComponent(symbol)}`
          : `/api/market-data/quote/${encodeURIComponent(symbol)}`;
        const response = await fetch(endpoint, { signal: controller.signal });
        if (!response.ok) throw new Error(`Quote API returned HTTP ${response.status}.`);
        const nextQuote = (await response.json()) as ArgentinaQuote | MarketQuoteResponse;
        if (!controller.signal.aborted) {
          setQuote(nextQuote);
          setError("error" in nextQuote ? nextQuote.error ?? null : null);
        }
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setQuote(null);
          setError(requestError instanceof Error ? requestError.message : "Quote request failed.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadQuote();
    return () => controller.abort();
  }, [isArgentina, symbol]);

  const value = useMemo(() => ({ quote, loading, error, isArgentina }), [error, isArgentina, loading, quote]);
  return <AssetQuoteContext.Provider value={value}>{children}</AssetQuoteContext.Provider>;
}

export function useAssetQuote() {
  const context = useContext(AssetQuoteContext);
  if (!context) throw new Error("useAssetQuote must be used inside AssetQuoteProvider.");
  return context;
}
