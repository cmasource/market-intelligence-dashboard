"use client";

import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import type { InstrumentMarket, InstrumentSearchResult } from "@/lib/instruments/types";
import type { TradeRadarInterval, TradeRadarMarket, TradeRadarProviderName } from "@/lib/market-data/providers/base";
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
  const [selectedSuggestion, setSelectedSuggestion] = useState<InstrumentSearchResult | null>(null);
  const [providerStatus, setProviderStatus] = useState<TradeRadarProviderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const analyzeControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedSymbol = params.get("symbol")?.trim().toUpperCase();
    if (requestedSymbol) queueMicrotask(() => setSymbol(requestedSymbol));
  }, []);

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
    if (loading) return;
    analyzeControllerRef.current?.abort();
    const controller = new AbortController();
    analyzeControllerRef.current = controller;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/trade-radar/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          instrumentId: selectedSuggestion?.id,
          symbol: selectedSuggestion?.providerSymbol ?? selectedSuggestion?.bymaSymbol ?? symbol,
          market,
          interval,
          provider,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`);
      setAnalysis(data as TradeRadarAnalysis);
    } catch (requestError) {
      if (controller.signal.aborted) return;
      setAnalysis(null);
      setError(requestError instanceof Error ? requestError.message : "No se pudo completar el analisis.");
    } finally {
      if (analyzeControllerRef.current === controller) {
        analyzeControllerRef.current = null;
        setLoading(false);
      }
    }
  }

  function handleSymbolChange(nextSymbol: string) {
    setSymbol(nextSymbol);
    setSelectedSuggestion(null);
  }

  function handleSuggestionSelect(suggestion: InstrumentSearchResult) {
    setSelectedSuggestion(suggestion);
    setSymbol(suggestion.symbol);
    setMarket(marketFromInstrument(suggestion.market, suggestion.assetClass));
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

function marketFromInstrument(
  instrumentMarket: InstrumentMarket,
  assetClass: InstrumentSearchResult["assetClass"],
): TradeRadarMarket {
  if (instrumentMarket === "crypto") return "crypto";
  if (assetClass === "bond" || assetClass === "bill" || assetClass === "corporate_bond") return "bond";
  if (assetClass === "cedear" || assetClass === "cedear_etf") return "cedear";
  if (instrumentMarket === "argentina") return "argentina";
  return "us";
}
