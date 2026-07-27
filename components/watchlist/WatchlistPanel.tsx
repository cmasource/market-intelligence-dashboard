"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ListPlus, Pencil, Plus, Trash2 } from "lucide-react";
import { useArgentinaQuotes } from "@/lib/hooks/useArgentinaQuotes";
import { useProviderQuotes } from "@/lib/hooks/useProviderQuotes";
import { normalizeSymbol } from "@/lib/market-data/symbol-map";
import {
  WATCHLIST_UPDATED_EVENT,
  getWatchlistRepository,
  type Watchlist,
  type WatchlistItem,
} from "@/lib/watchlist";
import { AddAssetDialog } from "./AddAssetDialog";
import { WatchlistCard } from "./WatchlistCard";

type SortOption = "ticker" | "name" | "change-desc" | "change-asc";

function isLocalItem(item: WatchlistItem) {
  const market = `${item.market} ${item.exchange ?? ""}`.toLowerCase();
  return market.includes("argentina") || market.includes("byma");
}

export function WatchlistPanel() {
  const [mounted, setMounted] = useState(false);
  const [lists, setLists] = useState<Watchlist[]>([]);
  const [activeId, setActiveId] = useState("");
  const [itemsByList, setItemsByList] = useState<Record<string, WatchlistItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [createName, setCreateName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sort, setSort] = useState<SortOption>("ticker");

  const load = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const repository = getWatchlistRepository();
      const [nextLists, nextActiveId] = await Promise.all([repository.getWatchlists(), repository.getActiveWatchlistId()]);
      const entries = await Promise.all(nextLists.map(async (list) => [list.id, await repository.getItems(list.id)] as const));
      setLists(nextLists);
      setActiveId(nextActiveId);
      setItemsByList(Object.fromEntries(entries));
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudieron cargar las listas.");
    } finally { setMounted(true); setLoading(false); }
  }, []);

  useEffect(() => {
    queueMicrotask(() => { void load(true); });
    const sync = () => { void load(); };
    window.addEventListener(WATCHLIST_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(WATCHLIST_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [load]);

  const activeList = lists.find((list) => list.id === activeId) ?? lists[0];
  const items = useMemo(() => activeList ? itemsByList[activeList.id] ?? [] : [], [activeList, itemsByList]);
  const argentinaSymbols = useMemo(() => items.filter(isLocalItem).map((item) => item.bymaSymbol ?? item.symbol), [items]);
  const providerSymbols = useMemo(() => items.filter((item) => !isLocalItem(item)).map((item) => item.providerSymbol ?? item.normalizedSymbol), [items]);
  const argentinaQuotes = useArgentinaQuotes(argentinaSymbols);
  const providerQuotes = useProviderQuotes(providerSymbols);

  const assetTypes = useMemo(() => Array.from(new Set(items.map((item) => item.assetType))).sort(), [items]);
  const visibleItems = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("es");
    const changeFor = (item: WatchlistItem) => {
      if (isLocalItem(item)) return argentinaQuotes[item.bymaSymbol ?? item.symbol]?.changePercent ?? Number.NEGATIVE_INFINITY;
      return providerQuotes[normalizeSymbol(item.providerSymbol ?? item.normalizedSymbol)]?.changePercent ?? Number.NEGATIVE_INFINITY;
    };
    return items
      .filter((item) => typeFilter === "all" || item.assetType === typeFilter)
      .filter((item) => !needle || `${item.symbol} ${item.displaySymbol} ${item.name}`.toLocaleLowerCase("es").includes(needle))
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name, "es");
        if (sort === "change-desc") return changeFor(b) - changeFor(a);
        if (sort === "change-asc") return changeFor(a) - changeFor(b);
        return a.displaySymbol.localeCompare(b.displaySymbol, "es");
      });
  }, [argentinaQuotes, items, providerQuotes, query, sort, typeFilter]);

  async function selectList(id: string) {
    await getWatchlistRepository().setActiveWatchlistId(id);
    setQuery("");
    setTypeFilter("all");
  }

  async function createList() {
    try {
      const created = await getWatchlistRepository().createWatchlist({ name: createName });
      setCreateName("");
      setStatus(`Lista “${created.name}” creada.`);
    } catch (requestError) { setStatus(requestError instanceof Error ? requestError.message : "No se pudo crear la lista."); }
  }

  async function renameList(id: string) {
    try {
      const renamed = await getWatchlistRepository().renameWatchlist(id, editingName);
      setEditingId(null);
      setStatus(`Lista renombrada como “${renamed.name}”.`);
    } catch (requestError) { setStatus(requestError instanceof Error ? requestError.message : "No se pudo renombrar la lista."); }
  }

  async function deleteList(list: Watchlist) {
    if (!window.confirm(`¿Eliminar la lista “${list.name}”? Los activos dejarán de estar seguidos en esta lista.`)) return;
    try {
      await getWatchlistRepository().deleteWatchlist(list.id);
      setStatus(`Lista “${list.name}” eliminada.`);
    } catch (requestError) { setStatus(requestError instanceof Error ? requestError.message : "No se pudo eliminar la lista."); }
  }

  async function removeItem(item: WatchlistItem) {
    if (!activeList || !window.confirm(`¿Quitar ${item.displaySymbol} de “${activeList.name}”?`)) return;
    await getWatchlistRepository().removeItem(activeList.id, item.id);
    setStatus(`${item.displaySymbol} fue quitado de “${activeList.name}”.`);
  }

  async function moveItem(item: WatchlistItem, targetId: string) {
    if (!activeList) return;
    await getWatchlistRepository().moveItem(item.id, activeList.id, targetId);
    setStatus(`${item.displaySymbol} fue movido a “${lists.find((list) => list.id === targetId)?.name}”.`);
  }

  async function copyItem(item: WatchlistItem, targetId: string) {
    await getWatchlistRepository().copyItem(item.id, targetId);
    setStatus(`${item.displaySymbol} fue copiado a “${lists.find((list) => list.id === targetId)?.name}”.`);
  }

  function quoteFor(item: WatchlistItem) {
    if (isLocalItem(item)) {
      const quote = argentinaQuotes[item.bymaSymbol ?? item.symbol];
      return { price: quote?.price, changePercent: quote?.changePercent, currency: quote?.currency, updatedAt: quote?.lastUpdated, loading: quote?.isLoading };
    }
    const quote = providerQuotes[normalizeSymbol(item.providerSymbol ?? item.normalizedSymbol)];
    return { price: quote?.price, changePercent: quote?.changePercent, currency: quote?.currency, updatedAt: quote?.fetchedAt, loading: quote?.isLoading };
  }

  if (!mounted || loading) return <div className="cma-panel p-6 text-sm text-[var(--cma-text-muted)]">Cargando listas locales...</div>;
  if (error) return <div role="alert" className="cma-panel border-rose-300/30 p-6 text-sm text-rose-200">{error}</div>;

  return (
    <section className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="cma-panel h-fit p-4 lg:sticky lg:top-20">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--cma-text-primary)]">Tus listas</h2>
          <span className="text-xs text-[var(--cma-text-muted)]">{lists.length}</span>
        </div>
        <label htmlFor="mobile-watchlist-select" className="sr-only">Seleccionar lista</label>
        <select id="mobile-watchlist-select" value={activeId} onChange={(event) => void selectList(event.target.value)} className="mt-4 min-h-11 w-full rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] px-3 text-sm lg:hidden">
          {lists.map((list) => <option key={list.id} value={list.id}>{list.name} ({list.itemCount})</option>)}
        </select>
        <div className="mt-4 hidden space-y-1 lg:block">
          {lists.map((list) => (
            <button key={list.id} type="button" onClick={() => void selectList(list.id)} className={`flex min-h-11 w-full items-center justify-between rounded-lg border px-3 text-left text-sm ${list.id === activeId ? "border-cyan-300/35 bg-cyan-300/10 text-cyan-100" : "border-transparent text-[var(--cma-text-secondary)] hover:border-[var(--cma-border-soft)]"}`}>
              <span className="truncate">{list.name}</span><span className="ml-3 text-xs text-[var(--cma-text-muted)]">{list.itemCount}</span>
            </button>
          ))}
        </div>
        <form className="mt-5 border-t border-[var(--cma-border-soft)] pt-4" onSubmit={(event) => { event.preventDefault(); void createList(); }}>
          <label htmlFor="quick-watchlist-name" className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cma-text-muted)]">Nueva lista</label>
          <input id="quick-watchlist-name" value={createName} onChange={(event) => setCreateName(event.target.value)} placeholder="Ej. Tecnología" className="mt-2 min-h-11 w-full rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 text-sm outline-none focus:border-[var(--cma-border-strong)]" />
          <button type="submit" className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[var(--cma-border-soft)] text-sm font-medium text-[var(--cma-text-primary)] hover:border-[var(--cma-border-strong)]"><Plus size={16} aria-hidden="true" /> Crear lista</button>
        </form>
      </aside>

      <div className="min-w-0">
        {activeList ? (
          <>
            <div className="cma-panel-elevated p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  {editingId === activeList.id ? (
                    <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); void renameList(activeList.id); }}>
                      <label htmlFor="rename-watchlist" className="sr-only">Nuevo nombre de la lista</label>
                      <input id="rename-watchlist" autoFocus value={editingName} onChange={(event) => setEditingName(event.target.value)} className="min-h-11 rounded-lg border border-[var(--cma-border-strong)] bg-[var(--cma-bg-panel)] px-3 text-lg font-semibold outline-none" />
                      <button type="submit" className="min-h-11 rounded-lg border border-cyan-300/30 px-3 text-sm text-cyan-100">Guardar</button>
                      <button type="button" onClick={() => setEditingId(null)} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] px-3 text-sm">Cancelar</button>
                    </form>
                  ) : <h2 className="text-2xl font-semibold text-[var(--cma-text-primary)]">{activeList.name}</h2>}
                  <p className="mt-2 text-sm text-[var(--cma-text-secondary)]">{items.length} {items.length === 1 ? "activo" : "activos"} en seguimiento</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => { setEditingId(activeList.id); setEditingName(activeList.name); }} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--cma-border-soft)] px-3 text-sm text-[var(--cma-text-secondary)]"><Pencil size={15} aria-hidden="true" /> Renombrar</button>
                  <button type="button" onClick={() => void deleteList(activeList)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--cma-border-soft)] px-3 text-sm text-[var(--cma-text-secondary)] hover:border-rose-300/40 hover:text-rose-200"><Trash2 size={15} aria-hidden="true" /> Eliminar</button>
                  <button type="button" onClick={() => setAssetDialogOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-cyan-300/35 bg-cyan-300/10 px-4 text-sm font-semibold text-cyan-100"><ListPlus size={16} aria-hidden="true" /> Agregar activo</button>
                </div>
              </div>
            </div>

            {items.length ? (
              <div className="mt-4 grid gap-3 rounded-xl border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] p-4 md:grid-cols-[minmax(180px,1fr)_minmax(150px,.55fr)_minmax(170px,.6fr)]">
                <label className="grid gap-1 text-xs text-[var(--cma-text-muted)]">Buscar en esta lista<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ticker o nombre" className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 text-sm text-[var(--cma-text-primary)] outline-none focus:border-[var(--cma-border-strong)]" /></label>
                <label className="grid gap-1 text-xs text-[var(--cma-text-muted)]">Tipo de activo<select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 text-sm text-[var(--cma-text-primary)]"><option value="all">Todos</option>{assetTypes.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select></label>
                <label className="grid gap-1 text-xs text-[var(--cma-text-muted)]">Ordenar por<select value={sort} onChange={(event) => setSort(event.target.value as SortOption)} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 text-sm text-[var(--cma-text-primary)]"><option value="ticker">Ticker</option><option value="name">Nombre</option><option value="change-desc">Variación: mayor a menor</option><option value="change-asc">Variación: menor a mayor</option></select></label>
              </div>
            ) : null}

            {status ? <p role="status" aria-live="polite" className="mt-4 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] p-3 text-sm text-[var(--cma-text-secondary)]">{status}</p> : null}

            {!items.length ? (
              <div className="cma-panel mt-4 p-8 text-center">
                <h3 className="text-xl font-semibold text-[var(--cma-text-primary)]">Aún no agregaste activos a esta lista.</h3>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--cma-text-secondary)]">Usá el catálogo del Trade Radar para seguir instrumentos sin registrar posiciones, cantidades ni operaciones.</p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <button type="button" onClick={() => setAssetDialogOpen(true)} className="min-h-11 rounded-lg border border-cyan-300/35 bg-cyan-300/10 px-4 text-sm font-semibold text-cyan-100">Agregar activo</button>
                  <Link href="/trade-radar" className="inline-flex min-h-11 items-center rounded-lg border border-[var(--cma-border-soft)] px-4 text-sm text-[var(--cma-text-secondary)]">Ir a Trade Radar</Link>
                </div>
              </div>
            ) : visibleItems.length ? (
              <div className="mt-4 space-y-3">
                {visibleItems.map((item) => {
                  const quote = quoteFor(item);
                  const memberships = lists.filter((list) => list.id !== activeId && (itemsByList[list.id] ?? []).some((candidate) => candidate.assetKey === item.assetKey)).map((list) => list.name);
                  return <WatchlistCard key={item.id} item={item} lists={lists} activeListId={activeId} memberships={memberships} {...quote} onRemove={() => void removeItem(item)} onMove={(target) => void moveItem(item, target)} onCopy={(target) => void copyItem(item, target)} />;
                })}
              </div>
            ) : <div className="cma-panel mt-4 p-6 text-sm text-[var(--cma-text-muted)]">No hay activos que coincidan con los filtros.</div>}
            <AddAssetDialog open={assetDialogOpen} watchlistId={activeList.id} onClose={() => setAssetDialogOpen(false)} onAdded={() => void load()} />
          </>
        ) : null}
      </div>
    </section>
  );
}
