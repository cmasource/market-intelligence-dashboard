"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [market, setMarket] = useState<TradeRadarMarket>("auto");
  const [interval, setInterval] = useState<TradeRadarInterval>("1d");
  const [provider, setProvider] = useState<TradeRadarProviderName>("auto");
  const [analysis, setAnalysis] = useState<TradeRadarAnalysis | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<InstrumentSearchResult | null>(null);
  const [providerStatus, setProviderStatus] = useState<TradeRadarProviderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const analyzeControllerRef = useRef<AbortController | null>(null);
  const loadingRef = useRef(false);
  const initializedFromUrlRef = useRef(false);

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

  const analyze = useCallback(async (overrides?: {
    instrumentId?: string;
    symbol?: string;
    market?: TradeRadarMarket;
    interval?: TradeRadarInterval;
    selectedSuggestion?: InstrumentSearchResult | null;
  }) => {
    if (loadingRef.current) return;
    const suggestion = overrides?.selectedSuggestion ?? selectedSuggestion;
    const requestedSymbol = overrides?.symbol ?? symbol;
    const requestedMarket = overrides?.market ?? market;
    const requestedInterval = overrides?.interval ?? interval;
    loadingRef.current = true;
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
          instrumentId: overrides?.instrumentId ?? suggestion?.id,
          symbol: suggestion?.providerSymbol ?? suggestion?.bymaSymbol ?? requestedSymbol,
          market: requestedMarket,
          interval: requestedInterval,
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
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [interval, market, provider, selectedSuggestion, symbol]);

  useEffect(() => {
    if (initializedFromUrlRef.current) return;
    initializedFromUrlRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const requestedSymbol = params.get("symbol")?.trim().toUpperCase();
    const requestedInstrumentId = params.get("instrumentId")?.trim();
    const requestedInterval = params.get("interval") === "1h" || params.get("interval") === "4h" ? params.get("interval") as TradeRadarInterval : "1d";
    const shouldAnalyze = params.get("analyze") === "1";

    if (!requestedSymbol && !requestedInstrumentId) return;

    const controller = new AbortController();
    async function initialize() {
      let suggestion: InstrumentSearchResult | null = null;
      if (requestedInstrumentId) {
        try {
          const query = new URLSearchParams({ q: requestedInstrumentId, limit: "10" });
          const response = await fetch(`/api/trade-radar/search?${query.toString()}`, { signal: controller.signal });
          if (response.ok) {
            const payload = await response.json() as { results?: InstrumentSearchResult[] };
            suggestion = payload.results?.find((candidate) => candidate.id === requestedInstrumentId) ?? null;
          }
        } catch {
          if (controller.signal.aborted) return;
        }
      }

      const nextSymbol = suggestion?.symbol ?? requestedSymbol ?? symbol;
      const nextMarket = suggestion ? marketFromInstrument(suggestion.market, suggestion.assetClass) : "auto";
      setSymbol(nextSymbol);
      setSelectedSuggestion(suggestion);
      setMarket(nextMarket);
      setInterval(requestedInterval);

      if (shouldAnalyze) {
        await analyze({
          instrumentId: requestedInstrumentId,
          symbol: nextSymbol,
          market: nextMarket,
          interval: requestedInterval,
          selectedSuggestion: suggestion,
        });
      }
    }
    void initialize();
    return () => controller.abort();
  }, [analyze, symbol]);

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
          interval={interval}
          provider={provider}
          loading={loading}
          selectedSuggestion={selectedSuggestion}
          onSymbolChange={handleSymbolChange}
          onIntervalChange={setInterval}
          onProviderChange={setProvider}
          onSuggestionSelect={handleSuggestionSelect}
          onSubmit={() => void analyze()}
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
