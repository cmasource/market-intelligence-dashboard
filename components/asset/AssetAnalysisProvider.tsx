"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AssetAnalysisBundle } from "@/lib/analysis/asset-analysis-bundle";
import { useLanguage } from "@/lib/i18n/useLanguage";

type AssetAnalysisContextValue = {
  bundle: AssetAnalysisBundle | null;
  loading: boolean;
  error: string | null;
};

const AssetAnalysisContext = createContext<AssetAnalysisContextValue | null>(null);

export function AssetAnalysisProvider({ symbol, enabled = true, children }: { symbol: string; enabled?: boolean; children: ReactNode }) {
  const { language } = useLanguage();
  const [bundle, setBundle] = useState<AssetAnalysisBundle | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/analysis/asset/${encodeURIComponent(symbol)}?language=${language}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(`Asset analysis API returned HTTP ${response.status}.`);
        const nextBundle = (await response.json()) as AssetAnalysisBundle;
        if (!controller.signal.aborted) setBundle(nextBundle);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : "Asset analysis request failed.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [enabled, language, symbol]);

  const value = useMemo(() => ({ bundle, loading, error }), [bundle, error, loading]);

  return <AssetAnalysisContext.Provider value={value}>{children}</AssetAnalysisContext.Provider>;
}

export function useAssetAnalysis() {
  const context = useContext(AssetAnalysisContext);
  if (!context) throw new Error("useAssetAnalysis must be used inside AssetAnalysisProvider.");
  return context;
}
