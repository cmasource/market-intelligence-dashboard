"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AccessibleDialog } from "@/components/ui/AccessibleDialog";
import {
  WATCHLIST_UPDATED_EVENT,
  buildWatchlistAssetKey,
  getWatchlistRepository,
  type Watchlist,
  type WatchlistItemInput,
} from "@/lib/watchlist";

type AddToWatchlistDialogProps = {
  open: boolean;
  item: WatchlistItemInput;
  onClose: () => void;
};

export function AddToWatchlistDialog({ open, item, onClose }: AddToWatchlistDialogProps) {
  const [lists, setLists] = useState<Watchlist[]>([]);
  const [memberships, setMemberships] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newName, setNewName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const assetKey = useMemo(() => buildWatchlistAssetKey(item), [item]);

  const load = useCallback(async () => {
    const repository = getWatchlistRepository();
    const [nextLists, currentMemberships] = await Promise.all([
      repository.getWatchlists(),
      repository.getMemberships(assetKey),
    ]);
    setLists(nextLists);
    setMemberships(new Set(currentMemberships.map((list) => list.id)));
  }, [assetKey]);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      setSelected(new Set());
      setMessage(null);
      void load();
    });
    const sync = () => { void load(); };
    window.addEventListener(WATCHLIST_UPDATED_EVENT, sync);
    return () => window.removeEventListener(WATCHLIST_UPDATED_EVENT, sync);
  }, [load, open]);

  async function addSelected() {
    const targets = [...selected].filter((id) => !memberships.has(id));
    if (!targets.length) {
      setMessage(memberships.size ? "El activo ya estaba incluido en las listas seleccionadas." : "Elegí al menos una lista.");
      return;
    }
    setBusy(true);
    try {
      const repository = getWatchlistRepository();
      await Promise.all(targets.map((id) => repository.addItem(id, item)));
      setMessage(targets.length === 1 ? "Activo agregado a la lista." : `Activo agregado a ${targets.length} listas.`);
      setSelected(new Set());
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo agregar el activo.");
    } finally { setBusy(false); }
  }

  async function createAndAdd() {
    setBusy(true);
    try {
      const repository = getWatchlistRepository();
      const created = await repository.createWatchlist({ name: newName });
      await repository.addItem(created.id, item);
      setNewName("");
      setMessage(`Lista “${created.name}” creada y activo agregado.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear la lista.");
    } finally { setBusy(false); }
  }

  return (
    <AccessibleDialog open={open} onClose={onClose} title="Agregar a lista" description={`${item.displaySymbol || item.symbol} · ${item.name}`}>
      <fieldset disabled={busy}>
        <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cma-text-muted)]">Listas disponibles</legend>
        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
          {lists.map((list) => {
            const included = memberships.has(list.id);
            return (
              <label key={list.id} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-[var(--cma-border-soft)] px-3 py-2 hover:border-[var(--cma-border-strong)]">
                <input
                  type="checkbox"
                  checked={included || selected.has(list.id)}
                  disabled={included}
                  onChange={(event) => setSelected((current) => {
                    const next = new Set(current);
                    if (event.target.checked) next.add(list.id); else next.delete(list.id);
                    return next;
                  })}
                  className="h-4 w-4 accent-[var(--cma-accent-cyan)]"
                />
                <span className="min-w-0 flex-1 text-sm font-medium text-[var(--cma-text-primary)]">{list.name}</span>
                <span className="text-xs text-[var(--cma-text-muted)]">{list.itemCount} activos</span>
                {included ? <span className="text-xs font-medium text-[var(--cma-positive)]">Ya incluido</span> : null}
              </label>
            );
          })}
        </div>
        <button type="button" onClick={addSelected} className="mt-4 min-h-11 w-full rounded-lg border border-cyan-300/35 bg-cyan-300/10 px-4 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/15 disabled:opacity-50">
          {busy ? "Guardando..." : "Agregar a las listas elegidas"}
        </button>
      </fieldset>

      <form className="mt-5 border-t border-[var(--cma-border-soft)] pt-5" onSubmit={(event) => { event.preventDefault(); void createAndAdd(); }}>
        <label htmlFor="new-watchlist-name" className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cma-text-muted)]">Crear una lista nueva</label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input id="new-watchlist-name" value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Ej. Oportunidades" className="min-h-11 flex-1 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] px-3 text-sm outline-none focus:border-[var(--cma-border-strong)]" />
          <button type="submit" disabled={busy} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] px-4 text-sm font-medium text-[var(--cma-text-primary)] hover:border-[var(--cma-border-strong)] disabled:opacity-50">Crear y agregar</button>
        </div>
      </form>
      {message ? <p role="status" aria-live="polite" className="mt-4 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] p-3 text-sm text-[var(--cma-text-secondary)]">{message}</p> : null}
    </AccessibleDialog>
  );
}
