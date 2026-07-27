"use client";

import { useEffect, useRef, useState } from "react";
import type { InstrumentSearchResult } from "@/lib/instruments/types";

export function useInstrumentSearch(query: string, enabled = true) {
  const [results, setResults] = useState<InstrumentSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestQueryRef = useRef("");

  useEffect(() => {
    const normalizedQuery = query.trim();
    latestQueryRef.current = normalizedQuery;
    if (!enabled || normalizedQuery.length < 2) {
      queueMicrotask(() => {
        setResults([]);
        setLoading(false);
        setError(null);
      });
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ q: normalizedQuery, limit: "100" });
        const response = await fetch(`/api/trade-radar/search?${params.toString()}`, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json() as { results?: InstrumentSearchResult[] };
        if (latestQueryRef.current === normalizedQuery) setResults(data.results ?? []);
      } catch (requestError) {
        if (!controller.signal.aborted && latestQueryRef.current === normalizedQuery) {
          setResults([]);
          setError(requestError instanceof Error ? requestError.message : "No se pudo buscar el instrumento.");
        }
      } finally {
        if (!controller.signal.aborted && latestQueryRef.current === normalizedQuery) setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [enabled, query]);

  return { results, loading, error };
}
