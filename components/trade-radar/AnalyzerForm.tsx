"use client";

import { useEffect, useRef, useState } from "react";
import type { InstrumentSearchResult } from "@/lib/instruments/types";
import type { TradeRadarInterval, TradeRadarMarket, TradeRadarProviderName } from "@/lib/market-data/providers/base";

type AnalyzerFormProps = {
  symbol: string;
  market: TradeRadarMarket;
  interval: TradeRadarInterval;
  provider: TradeRadarProviderName;
  loading: boolean;
  selectedSuggestion: InstrumentSearchResult | null;
  onSymbolChange: (symbol: string) => void;
  onMarketChange: (market: TradeRadarMarket) => void;
  onIntervalChange: (interval: TradeRadarInterval) => void;
  onProviderChange: (provider: TradeRadarProviderName) => void;
  onSuggestionSelect: (suggestion: InstrumentSearchResult) => void;
  onSubmit: () => void;
};

const marketOptions: Array<{ value: TradeRadarMarket; label: string }> = [
  { value: "auto", label: "Auto" },
  { value: "us", label: "US" },
  { value: "argentina", label: "Argentina" },
  { value: "cedear", label: "CEDEAR" },
  { value: "crypto", label: "Crypto" },
  { value: "bond", label: "Bono" },
];

const intervalOptions: Array<{ value: TradeRadarInterval; label: string }> = [
  { value: "1h", label: "1h" },
  { value: "4h", label: "4h" },
  { value: "1d", label: "1d" },
];

const providerOptions: Array<{ value: TradeRadarProviderName; label: string }> = [
  { value: "auto", label: "Auto" },
  { value: "twelveData", label: "Twelve Data" },
  { value: "alphaVantage", label: "Alpha Vantage" },
  { value: "fmp", label: "FMP" },
  { value: "byma", label: "BYMA" },
  { value: "binance", label: "Binance" },
];

export function AnalyzerForm({
  symbol,
  market,
  interval,
  provider,
  loading,
  selectedSuggestion,
  onSymbolChange,
  onMarketChange,
  onIntervalChange,
  onProviderChange,
  onSuggestionSelect,
  onSubmit,
}: AnalyzerFormProps) {
  const [suggestions, setSuggestions] = useState<InstrumentSearchResult[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const latestQueryRef = useRef("");

  useEffect(() => {
    const query = symbol.trim();
    latestQueryRef.current = query;

    if (query.length < 2) {
      return undefined;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const params = new URLSearchParams({ q: query, limit: "100" });
        const response = await fetch(`/api/trade-radar/search?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as { results?: InstrumentSearchResult[] };
        if (latestQueryRef.current === query) {
          setSuggestions(data.results ?? []);
          setSuggestionsOpen(true);
        }
      } catch (error) {
        if (!controller.signal.aborted && latestQueryRef.current === query) {
          setSuggestions([]);
          setSearchError(error instanceof Error ? error.message : "No se pudo buscar el instrumento.");
          setSuggestionsOpen(true);
        }
      } finally {
        if (!controller.signal.aborted && latestQueryRef.current === query) {
          setSearchLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [symbol]);

  return (
    <form
      className="cma-panel-elevated cma-glow-cyan grid gap-4 p-4 sm:grid-cols-[minmax(220px,1.2fr)_repeat(3,minmax(130px,0.7fr))_auto] sm:items-start sm:p-5"
      style={{ overflow: "visible" }}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label className="relative grid gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Ticker</span>
        <input
          className="h-11 rounded-lg border border-white/10 bg-slate-950/70 px-3 font-mono text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60"
          placeholder="SPY, AAPL, BTCUSDT, AL30"
          value={symbol}
          onChange={(event) => {
            const nextSymbol = event.target.value.toUpperCase();
            onSymbolChange(nextSymbol);
            setSuggestions([]);
            if (nextSymbol.trim().length < 2) {
              setSuggestionsOpen(false);
              setSearchLoading(false);
              setSearchError(null);
            } else {
              setSuggestionsOpen(true);
            }
          }}
          onFocus={() => setSuggestionsOpen(symbol.trim().length >= 2 && (suggestions.length > 0 || searchLoading || Boolean(searchError)))}
          onKeyDown={(event) => {
            if (event.key === "Escape") setSuggestionsOpen(false);
          }}
          autoComplete="off"
        />
        {selectedSuggestion ? (
          <span className="text-xs text-slate-400">
            {selectedSuggestion.name} - {selectedSuggestion.market} - {selectedSuggestion.exchange}
          </span>
        ) : null}
        {suggestionsOpen && (suggestions.length > 0 || searchLoading || searchError || symbol.trim().length >= 2) ? (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[28rem] overflow-y-auto rounded-lg border border-cyan-300/20 bg-slate-950 shadow-2xl shadow-black/40">
            {searchLoading ? (
              <div className="px-3 py-3 text-sm text-slate-400">Buscando instrumentos...</div>
            ) : null}
            {searchError ? (
              <div className="px-3 py-3 text-sm text-amber-100">Busqueda no disponible: {searchError}</div>
            ) : null}
            {!searchLoading && !searchError && suggestions.length === 0 ? (
              <div className="px-3 py-3 text-sm text-slate-400">Sin resultados reales para este texto.</div>
            ) : null}
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                className="grid w-full gap-1 border-b border-white/10 px-3 py-2 text-left last:border-b-0 hover:bg-cyan-300/10"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSuggestionSelect(suggestion);
                  setSuggestionsOpen(false);
                }}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-mono text-sm font-semibold text-white">{suggestion.displaySymbol}</span>
                  <span className="flex flex-wrap justify-end gap-1">
                    {suggestion.badges.slice(0, 3).map((badge) => (
                      <span
                        key={badge}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[0.68rem] text-slate-300"
                      >
                        {badge}
                      </span>
                    ))}
                  </span>
                </span>
                <span className="text-xs text-slate-400">{suggestion.name}</span>
                <span className="text-[0.68rem] text-slate-500">
                  {suggestion.providerSymbol ?? suggestion.bymaSymbol ?? suggestion.symbol} - {suggestion.tradingViewSymbol} - {suggestion.exchange}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </label>

      <label className="grid gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Mercado</span>
        <select
          className="h-11 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
          value={market}
          onChange={(event) => onMarketChange(event.target.value as TradeRadarMarket)}
        >
          {marketOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Temporalidad</span>
        <select
          className="h-11 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
          value={interval}
          onChange={(event) => onIntervalChange(event.target.value as TradeRadarInterval)}
        >
          {intervalOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-500">Intervalos acotados para lectura comparable.</span>
      </label>

      <label className="grid gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Proveedor</span>
        <select
          className="h-11 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
          value={provider}
          onChange={(event) => onProviderChange(event.target.value as TradeRadarProviderName)}
        >
          {providerOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <button
        className="h-11 rounded-lg border border-cyan-300/45 bg-cyan-300/15 px-5 text-sm font-semibold text-cyan-50 transition hover:border-cyan-200 hover:bg-cyan-300/22 disabled:cursor-not-allowed disabled:opacity-55 sm:mt-6"
        type="submit"
        disabled={loading || !symbol.trim()}
      >
        {loading ? "Analizando..." : "Analizar"}
      </button>
    </form>
  );
}
