"use client";

import { useEffect, useMemo, useState } from "react";
import { normalizeArgentinaSymbol, type ArgentinaQuote } from "@/lib/argentina";

export type ArgentinaQuoteState = ArgentinaQuote & { isLoading: boolean };
type QuoteMap = Record<string, ArgentinaQuoteState>;
type CachedQuote = { quote: ArgentinaQuote; cachedAt: number };

const QUOTE_REFRESH_MS = 60_000;
const quoteCache = new Map<string, CachedQuote>();

function loadingQuote(symbol: string): ArgentinaQuoteState {
  return {
    symbol, price: null, currency: "ARS", change: null, changePercent: null, source: "unavailable",
    sourceLabel: "Loading Argentina quote", isRealData: false, isFallback: true, isLoading: true,
  };
}

export function useArgentinaQuotes(symbols: string[], refreshKey = 0) {
  const inputKey = symbols.map((symbol) => normalizeArgentinaSymbol(symbol)).join("|");
  const normalizedSymbols = useMemo(() => Array.from(new Set(inputKey.split("|").filter(Boolean))), [inputKey]);
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
        return [symbol, cached ? { ...cached, isLoading: false } : loadingQuote(symbol)];
      })));
    });

    async function loadQuotes() {
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch("/api/argentina/quotes", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbols: normalizedSymbols }),
          cache: "no-store", signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Argentina quote batch returned HTTP ${response.status}.`);
        const data = await response.json() as { quotes?: Record<string, ArgentinaQuote> };
        const cachedAt = Date.now();
        for (const [symbol, quote] of Object.entries(data.quotes ?? {})) quoteCache.set(normalizeArgentinaSymbol(symbol), { quote, cachedAt });
        if (!active) return;
        setQuotes(Object.fromEntries(normalizedSymbols.map((symbol) => {
          const quote = quoteCache.get(symbol)?.quote;
          return [symbol, quote ? { ...quote, isLoading: false } : { ...loadingQuote(symbol), isLoading: false }];
        })));
      } catch (error) {
        if (!active || (error instanceof DOMException && error.name === "AbortError")) return;
        setQuotes((current) => Object.fromEntries(normalizedSymbols.map((symbol) => [symbol, { ...(current[symbol] ?? loadingQuote(symbol)), isLoading: false }])));
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
