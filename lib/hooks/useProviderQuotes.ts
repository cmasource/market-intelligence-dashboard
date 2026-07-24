"use client";

import { useEffect, useMemo, useState } from "react";
import { isProviderQuoteSupported } from "@/lib/market-data/provider-symbols";
import { normalizeSymbol } from "@/lib/market-data/symbol-map";
import type { MarketQuoteResponse } from "@/lib/market-data/types";

export type ProviderQuoteState = MarketQuoteResponse & {
  isLoading: boolean;
};

type QuoteMap = Record<string, ProviderQuoteState>;

const quoteCache = new Map<string, MarketQuoteResponse>();

function loadingQuote(symbol: string): ProviderQuoteState {
  return {
    symbol,
    price: null,
    change: null,
    changePercent: null,
    currency: "USD",
    provider: "unavailable",
    sourceLabel: "Loading provider quote",
    isFallback: true,
    fetchedAt: new Date().toISOString(),
    isLoading: true,
  };
}

function stateFromQuote(quote: MarketQuoteResponse): ProviderQuoteState {
  return { ...quote, isLoading: false };
}

export function useProviderQuotes(symbols: string[]) {
  const inputKey = symbols.map((symbol) => normalizeSymbol(symbol)).join("|");
  const normalizedSymbols = useMemo(
    () =>
      Array.from(
        new Set(
          inputKey
            .split("|")
            .filter((symbol) => symbol && isProviderQuoteSupported(symbol)),
        ),
      ),
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
      setQuotes({});
      return () => {
        active = false;
      };
    }

    setQuotes((current) => {
      const next: QuoteMap = {};
      for (const symbol of normalizedSymbols) {
        const cached = quoteCache.get(symbol);
        next[symbol] = cached ? stateFromQuote(cached) : current[symbol] ?? loadingQuote(symbol);
      }
      return next;
    });

    if (!missingSymbols.length) {
      return () => {
        active = false;
      };
    }

    async function loadQuotes() {
      try {
        const batches = Array.from({ length: Math.ceil(missingSymbols.length / 20) }, (_, index) =>
          missingSymbols.slice(index * 20, index * 20 + 20),
        );
        const responses = await Promise.all(batches.map(async (batch) => {
          const response = await fetch("/api/market-data/quotes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ symbols: batch }),
          });
          if (!response.ok) throw new Error(`Quote batch returned HTTP ${response.status}.`);
          return response.json() as Promise<{ quotes?: Record<string, MarketQuoteResponse> }>;
        }));
        const incomingQuotes = Object.assign(
          {},
          ...responses.map((data) => data.quotes ?? {}),
        ) as Record<string, MarketQuoteResponse>;

        for (const [symbol, quote] of Object.entries(incomingQuotes)) {
          quoteCache.set(normalizeSymbol(symbol), quote);
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
                  error: "Provider quote unavailable.",
                };
          }
          return next;
        });
      } catch (error) {
        if (!active) return;
        setQuotes((current) => {
          const next: QuoteMap = {};
          for (const symbol of normalizedSymbols) {
            next[symbol] = {
              ...(current[symbol] ?? loadingQuote(symbol)),
              isLoading: false,
              error: error instanceof Error ? error.message : "Provider quote request failed.",
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
