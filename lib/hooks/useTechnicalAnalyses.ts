"use client";

import { useEffect, useMemo, useState } from "react";
import type { TechnicalAnalysisResponse } from "@/lib/analysis/types";
import { normalizeSymbol } from "@/lib/market-data/symbol-map";
import type { MarketDataTimeframe } from "@/lib/market-data/types";

type TechnicalAnalysisMap = Record<string, TechnicalAnalysisResponse | null>;

const analysisCache = new Map<string, TechnicalAnalysisResponse | null>();

function cacheKey(symbol: string, timeframe: MarketDataTimeframe, language: "en" | "es") {
  return `${symbol}|${timeframe}|${language}`;
}

function isUsableAnalysis(analysis: TechnicalAnalysisResponse) {
  return analysis.candlesCount > 0 && !analysis.isFallback && typeof analysis.technicalScore === "number";
}

export function useTechnicalAnalyses(
  symbols: string[],
  options: { enabled?: boolean; timeframe?: MarketDataTimeframe; language: "en" | "es" },
) {
  const timeframe = options.timeframe ?? "1Y";
  const enabled = options.enabled ?? true;
  const inputKey = symbols.map((symbol) => normalizeSymbol(symbol)).join("|");
  const normalizedSymbols = useMemo(
    () => Array.from(new Set(inputKey.split("|").filter(Boolean))),
    [inputKey],
  );
  const [analyses, setAnalyses] = useState<TechnicalAnalysisMap>({});

  useEffect(() => {
    if (!enabled || !normalizedSymbols.length) return;

    const controller = new AbortController();

    async function loadAnalyses() {
      const cachedEntries = normalizedSymbols
        .filter((symbol) => analysisCache.has(cacheKey(symbol, timeframe, options.language)))
        .map((symbol) => [symbol, analysisCache.get(cacheKey(symbol, timeframe, options.language))!] as const);
      const missingSymbols = normalizedSymbols.filter((symbol) => !analysisCache.has(cacheKey(symbol, timeframe, options.language)));

      if (cachedEntries.length) {
        setAnalyses((current) => ({ ...current, ...Object.fromEntries(cachedEntries) }));
      }

      const chunkSize = 8;
      for (let index = 0; index < missingSymbols.length; index += chunkSize) {
        if (controller.signal.aborted) return;
        const chunk = missingSymbols.slice(index, index + chunkSize);
        const results = await Promise.allSettled(chunk.map(async (symbol) => {
          const response = await fetch(`/api/analysis/technical/${encodeURIComponent(symbol)}?timeframe=${timeframe}&language=${options.language}`, {
            signal: controller.signal,
          });
          if (!response.ok) return [symbol, null] as const;
          const analysis = (await response.json()) as TechnicalAnalysisResponse;
          return [symbol, isUsableAnalysis(analysis) ? analysis : null] as const;
        }));

        if (controller.signal.aborted) return;

        const nextEntries = results.reduce<TechnicalAnalysisMap>((output, result, resultIndex) => {
          const symbol = chunk[resultIndex];
          const value = result.status === "fulfilled" ? result.value[1] : null;
          analysisCache.set(cacheKey(symbol, timeframe, options.language), value);
          output[symbol] = value;
          return output;
        }, {});

        setAnalyses((current) => ({ ...current, ...nextEntries }));
      }
    }

    void loadAnalyses();

    return () => controller.abort();
  }, [enabled, normalizedSymbols, options.language, timeframe]);

  return useMemo(() => {
    if (!enabled || !normalizedSymbols.length) return {};
    return Object.fromEntries(normalizedSymbols.map((symbol) => [symbol, analyses[symbol]]));
  }, [analyses, enabled, normalizedSymbols]);
}
