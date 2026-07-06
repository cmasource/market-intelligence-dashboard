"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import type { TradeRadarInterval, TradeRadarMarket, TradeRadarProviderName } from "@/lib/market-data/providers/base";
import type { SymbolCatalogItem } from "@/lib/market-data/symbol-catalog";
import type { TradeRadarProviderStatus } from "@/lib/market-data/trade-radar-provider-status";
import type { TradeRadarAnalysis } from "@/lib/technical/trade-radar";
import { AnalysisResult } from "./AnalysisResult";
import { AnalyzerForm } from "./AnalyzerForm";
import { ProviderStatusPanel } from "./ProviderStatusPanel";

export function TradeRadarPage() {
  const [symbol, setSymbol] = useState("SPY");
  const [market, setMarket] = useState<TradeRadarMarket>("us");
  const [interval, setInterval] = useState<TradeRadarInterval>("4h");
  const [provider, setProvider] = useState<TradeRadarProviderName>("auto");
  const [analysis, setAnalysis] = useState<TradeRadarAnalysis | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SymbolCatalogItem | null>(null);
  const [providerStatus, setProviderStatus] = useState<TradeRadarProviderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function loadStatus() {
      try {
        const response = await fetch("/api/trade-radar/provider-status", { signal: controller.signal });
        if (!response.ok) return;
        setProviderStatus((await response.json()) as TradeRadarProviderStatus);
      } catch {
        if (!controller.signal.aborted) setProviderStatus(null);
      }
    }
    loadStatus();
    return () => controller.abort();
  }, []);

  async function analyze() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/trade-radar/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: selectedSuggestion?.providerSymbol ?? symbol, market, interval, provider }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`);
      setAnalysis(data as TradeRadarAnalysis);
    } catch (requestError) {
      setAnalysis(null);
      setError(requestError instanceof Error ? requestError.message : "No se pudo completar el analisis.");
    } finally {
      setLoading(false);
    }
  }

  function handleSymbolChange(nextSymbol: string) {
    setSymbol(nextSymbol);
    setSelectedSuggestion(null);
  }

  function handleSuggestionSelect(suggestion: SymbolCatalogItem) {
    setSelectedSuggestion(suggestion);
    setSymbol(suggestion.symbol);
    setMarket(suggestion.market);
  }

  return (
    <AppShell>
      <div className="space-y-6 py-6">
        <section className="cma-panel cma-hero-panel p-6">
          <p className="cma-kicker">Modulo operativo</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">CMA Trade Radar</h1>
          <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-300">
            Analisis tecnico rapido con OHLCV real de proveedor, indicadores calculados en backend y trazabilidad visible de fuente, timestamp, delay, moneda y muestra usada.
          </p>
        </section>

        <ProviderStatusPanel status={providerStatus} />

        <AnalyzerForm
          symbol={symbol}
          market={market}
          interval={interval}
          provider={provider}
          loading={loading}
          selectedSuggestion={selectedSuggestion}
          onSymbolChange={handleSymbolChange}
          onMarketChange={setMarket}
          onIntervalChange={setInterval}
          onProviderChange={setProvider}
          onSuggestionSelect={handleSuggestionSelect}
          onSubmit={analyze}
        />

        {error ? (
          <div className="rounded-lg border border-rose-300/30 bg-rose-300/10 p-4 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-lg border border-white/10 bg-slate-950/45 p-5 text-sm text-slate-300">
            Calculando indicadores deterministas y validando fuente...
          </div>
        ) : null}

        {analysis ? <AnalysisResult analysis={analysis} /> : null}
      </div>
    </AppShell>
  );
}
