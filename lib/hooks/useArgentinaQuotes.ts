"use client";

import { useEffect, useMemo, useState } from "react";
import { normalizeArgentinaSymbol, type ArgentinaQuote } from "@/lib/argentina";

export type ArgentinaQuoteState = ArgentinaQuote & {
  isLoading: boolean;
};

type QuoteMap = Record<string, ArgentinaQuoteState>;

const quoteCache = new Map<string, ArgentinaQuote>();

function loadingQuote(symbol: string): ArgentinaQuoteState {
  return {
    symbol,
    price: null,
    currency: "ARS",
    change: null,
    changePercent: null,
    source: "unavailable",
    sourceLabel: "Loading Argentina quote",
    isRealData: false,
    isFallback: true,
    isLoading: true,
  };
}

function stateFromQuote(quote: ArgentinaQuote): ArgentinaQuoteState {
  return { ...quote, isLoading: false };
}

export function useArgentinaQuotes(symbols: string[]) {
  const inputKey = symbols.map((symbol) => normalizeArgentinaSymbol(symbol)).join("|");
  const normalizedSymbols = useMemo(
    () => Array.from(new Set(inputKey.split("|").filter(Boolean))),
    [inputKey],
  );
  const cacheKey = normalizedSymbols.join("|");
  const [quotes, setQuotes] = useState<QuoteMap>(() =>
    Object.fromEntries(
      normalizedSymbols
        .filter((symbol) => quoteCache.has(symbol))
        .map((symbol) => [symbol, stateFromQuote(quoteCache.get(symbol)!)]),
    ),
  );

  useEffect(() => {
    let active = true;
    const missingSymbols = normalizedSymbols.filter((symbol) => !quoteCache.has(symbol));

    if (!normalizedSymbols.length) {
      return () => {
        active = false;
      };
    }

    queueMicrotask(() => {
      if (!active) return;
      setQuotes((current) => {
        const next: QuoteMap = {};
        for (const symbol of normalizedSymbols) {
          const cached = quoteCache.get(symbol);
          next[symbol] = cached ? stateFromQuote(cached) : current[symbol] ?? loadingQuote(symbol);
        }
        return next;
      });
    });

    if (!missingSymbols.length) {
      return () => {
        active = false;
      };
    }

    async function loadQuotes() {
      try {
        const response = await fetch("/api/argentina/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbols: missingSymbols }),
        });

        if (!response.ok) throw new Error(`Argentina quote batch returned HTTP ${response.status}.`);
        const data = (await response.json()) as { quotes?: Record<string, ArgentinaQuote> };
        const incomingQuotes = data.quotes ?? {};

        for (const [symbol, quote] of Object.entries(incomingQuotes)) {
          quoteCache.set(normalizeArgentinaSymbol(symbol), quote);
        }

        if (!active) return;

        setQuotes((current) => {
          const next: QuoteMap = {};
          for (const symbol of normalizedSymbols) {
            const cached = quoteCache.get(symbol);
            next[symbol] = cached
              ? stateFromQuote(cached)
              : {
                  ...(current[symbol] ?? loadingQuote(symbol)),
                  isLoading: false,
                };
          }
          return next;
        });
      } catch {
        if (!active) return;
        setQuotes((current) => {
          const next: QuoteMap = {};
          for (const symbol of normalizedSymbols) {
            next[symbol] = {
              ...(current[symbol] ?? loadingQuote(symbol)),
              isLoading: false,
            };
          }
          return next;
        });
      }
    }

    void loadQuotes();

    return () => {
      active = false;
    };
  }, [cacheKey, normalizedSymbols]);

  return quotes;
}
