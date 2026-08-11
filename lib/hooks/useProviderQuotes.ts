"use client";

import { useEffect, useMemo, useState } from "react";
import { isProviderQuoteSupported } from "@/lib/market-data/provider-symbols";
import { normalizeSymbol } from "@/lib/market-data/symbol-map";
import type { MarketQuoteResponse } from "@/lib/market-data/types";

export type ProviderQuoteState = MarketQuoteResponse & { isLoading: boolean };
type QuoteMap = Record<string, ProviderQuoteState>;
type CachedQuote = { quote: MarketQuoteResponse; cachedAt: number };

const QUOTE_REFRESH_MS = 60_000;
const quoteCache = new Map<string, CachedQuote>();

function loadingQuote(symbol: string): ProviderQuoteState {
  return {
    symbol, price: null, change: null, changePercent: null, currency: "USD", provider: "unavailable",
    sourceLabel: "Loading provider quote", isFallback: true, observedAt: null,
    fetchedAt: new Date().toISOString(), dataDelay: "unknown", isLoading: true,
  };
}

function stateFromQuote(quote: MarketQuoteResponse): ProviderQuoteState {
  return { ...quote, isLoading: false };
}

export function useProviderQuotes(symbols: string[], refreshKey = 0) {
  const inputKey = symbols.map((symbol) => normalizeSymbol(symbol)).join("|");
  const normalizedSymbols = useMemo(() => Array.from(new Set(inputKey.split("|").filter((symbol) => symbol && isProviderQuoteSupported(symbol)))), [inputKey]);
  const cacheKey = normalizedSymbols.join("|");
  const [quotes, setQuotes] = useState<QuoteMap>({});

  useEffect(() => {
    let active = true;
    let controller: AbortController | null = null;

    if (!normalizedSymbols.length) {
      queueMicrotask(() => { if (active) setQuotes({}); });
      return () => { active = false; };
    }

    queueMicrotask(() => {
      if (!active) return;
      setQuotes(Object.fromEntries(normalizedSymbols.map((symbol) => {
        const cached = quoteCache.get(symbol)?.quote;
        return [symbol, cached ? stateFromQuote(cached) : loadingQuote(symbol)];
      })));
    });

    async function loadQuotes() {
      controller?.abort();
      controller = new AbortController();
      try {
        const batches = Array.from({ length: Math.ceil(normalizedSymbols.length / 20) }, (_, index) => normalizedSymbols.slice(index * 20, index * 20 + 20));
        const responses = await Promise.all(batches.map(async (batch) => {
          const response = await fetch("/api/market-data/quotes", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbols: batch }),
            cache: "no-store", signal: controller?.signal,
          });
          if (!response.ok) throw new Error(`Quote batch returned HTTP ${response.status}.`);
          return response.json() as Promise<{ quotes?: Record<string, MarketQuoteResponse> }>;
        }));
        const incoming = Object.assign({}, ...responses.map((data) => data.quotes ?? {})) as Record<string, MarketQuoteResponse>;
        const cachedAt = Date.now();
        for (const [symbol, quote] of Object.entries(incoming)) quoteCache.set(normalizeSymbol(symbol), { quote, cachedAt });
        if (!active) return;
        setQuotes(Object.fromEntries(normalizedSymbols.map((symbol) => {
          const quote = quoteCache.get(symbol)?.quote;
          return [symbol, quote ? stateFromQuote(quote) : { ...loadingQuote(symbol), isLoading: false, error: "Provider quote unavailable." }];
        })));
      } catch (error) {
        if (!active || (error instanceof DOMException && error.name === "AbortError")) return;
        setQuotes((current) => Object.fromEntries(normalizedSymbols.map((symbol) => [symbol, {
          ...(current[symbol] ?? loadingQuote(symbol)), isLoading: false,
          error: error instanceof Error ? error.message : "Provider quote request failed.",
        }])));
      }
    }

    const newestCache = Math.min(...normalizedSymbols.map((symbol) => quoteCache.get(symbol)?.cachedAt ?? 0));
    if (refreshKey > 0 || Date.now() - newestCache >= QUOTE_REFRESH_MS) void loadQuotes();
    const intervalId = window.setInterval(() => { if (document.visibilityState === "visible") void loadQuotes(); }, QUOTE_REFRESH_MS);
    const refreshWhenVisible = () => { if (document.visibilityState === "visible") void loadQuotes(); };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      active = false; controller?.abort(); window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshWhenVisible); document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [cacheKey, normalizedSymbols, refreshKey]);

  return quotes;
}
