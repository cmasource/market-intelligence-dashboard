"use client";

import { useState } from "react";
import { AccessibleDialog } from "@/components/ui/AccessibleDialog";
import { useInstrumentSearch } from "@/lib/hooks/useInstrumentSearch";
import { getWatchlistRepository, watchlistItemFromInstrument } from "@/lib/watchlist";

type AddAssetDialogProps = {
  open: boolean;
  watchlistId: string;
  onClose: () => void;
  onAdded: () => void;
};

export function AddAssetDialog({ open, watchlistId, onClose, onAdded }: AddAssetDialogProps) {
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { results, loading, error } = useInstrumentSearch(query, open);

  async function add(instrumentId: string) {
    const instrument = results.find((candidate) => candidate.id === instrumentId);
    if (!instrument) return;
    setBusyId(instrumentId);
    try {
      const repository = getWatchlistRepository();
      const before = await repository.getItems(watchlistId);
      const input = watchlistItemFromInstrument(instrument);
      const existing = before.some((item) => item.assetKey === `instrument:${instrument.id.toLowerCase()}`);
      await repository.addItem(watchlistId, input);
      setMessage(existing ? `${instrument.displaySymbol} ya estaba incluido.` : `${instrument.displaySymbol} fue agregado.`);
      onAdded();
    } catch (requestError) {
      setMessage(requestError instanceof Error ? requestError.message : "No se pudo agregar el activo.");
    } finally { setBusyId(null); }
  }

  return (
    <AccessibleDialog open={open} onClose={onClose} title="Agregar activo" description="Buscá el catálogo de instrumentos disponible en Trade Radar.">
      <label htmlFor="watchlist-asset-search" className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cma-text-muted)]">Ticker o nombre</label>
      <input
        id="watchlist-asset-search"
        value={query}
        onChange={(event) => { setQuery(event.target.value); setMessage(null); }}
        placeholder="Ej. AAPL, Galicia, AL30"
        autoComplete="off"
        className="mt-2 min-h-11 w-full rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] px-3 text-sm outline-none focus:border-[var(--cma-border-strong)]"
      />
      <div className="mt-3 max-h-[52vh] space-y-2 overflow-y-auto" aria-live="polite">
        {loading ? <p className="p-3 text-sm text-[var(--cma-text-muted)]">Buscando instrumentos...</p> : null}
        {error ? <p className="p-3 text-sm text-[var(--cma-warning)]">Búsqueda no disponible: {error}</p> : null}
        {!loading && !error && query.trim().length >= 2 && results.length === 0 ? <p className="p-3 text-sm text-[var(--cma-text-muted)]">Sin resultados para esta búsqueda.</p> : null}
        {results.map((instrument) => (
          <button
            key={instrument.id}
            type="button"
            disabled={busyId !== null}
            onClick={() => void add(instrument.id)}
            className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-[var(--cma-border-soft)] px-3 py-2 text-left hover:border-[var(--cma-border-strong)] disabled:opacity-55"
          >
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-sm font-semibold text-[var(--cma-text-primary)]">{instrument.displaySymbol}</span>
              <span className="mt-1 block truncate text-xs text-[var(--cma-text-secondary)]">{instrument.name}</span>
            </span>
            <span className="text-right text-xs text-[var(--cma-text-muted)]">
              <span className="block">{instrument.assetClass.replaceAll("_", " ")}</span>
              <span className="mt-1 block">{instrument.exchange || instrument.market}</span>
            </span>
          </button>
        ))}
      </div>
      {message ? <p role="status" className="mt-4 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] p-3 text-sm text-[var(--cma-text-secondary)]">{message}</p> : null}
    </AccessibleDialog>
  );
}
