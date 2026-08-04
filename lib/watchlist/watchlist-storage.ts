import {
  DEFAULT_WATCHLIST_NAME,
  LEGACY_WATCHLIST_STORAGE_KEY,
  WATCHLIST_SCHEMA_VERSION,
  WATCHLIST_STORAGE_KEY,
  WATCHLIST_UPDATED_EVENT,
  type LocalWatchlistRepository,
  type StoredWatchlist,
  type Watchlist,
  type WatchlistInput,
  type WatchlistItem,
  type WatchlistItemInput,
  type WatchlistStore,
} from "./watchlist-types";
import { instrumentMasterSeed } from "@/lib/instruments/instrument-master.seed";
import { createClient } from "@/lib/supabase/client";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function now() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function normalizeWatchlistName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function comparableName(name: string) {
  return normalizeWatchlistName(name).replace(/\s/g, "").toLocaleLowerCase("es");
}

function normalizedSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

function inferInstrumentId(input: Pick<WatchlistItemInput, "instrumentId" | "symbol" | "market" | "exchange" | "assetType">) {
  if (input.instrumentId?.trim()) return input.instrumentId.trim();
  const symbol = normalizedSymbol(input.symbol);
  const candidates = instrumentMasterSeed.filter((instrument) => instrument.symbol === symbol || instrument.displaySymbol.toUpperCase() === symbol);
  if (!candidates.length) return undefined;
  const requestedType = input.assetType.toLowerCase();
  const typeAliases: Record<string, string[]> = {
    equity: ["stock"],
    sovereign_bond: ["bond"],
    global_bond: ["bond"],
    cer_bond: ["bond"],
    dollar_linked_bond: ["bond"],
    letra: ["bill"],
    lecap: ["bill"],
  };
  const acceptedTypes = new Set([requestedType, ...(typeAliases[requestedType] ?? [])]);
  const byType = candidates.filter((instrument) => acceptedTypes.has(instrument.assetClass));
  if (byType.length === 1) return byType[0].id;
  const marketText = `${input.market} ${input.exchange ?? ""}`.toLowerCase();
  const byVenue = candidates.filter((instrument) => marketText.includes(instrument.market) || marketText.includes(instrument.exchange.toLowerCase()));
  if (byVenue.length === 1) return byVenue[0].id;
  return candidates.length === 1 ? candidates[0].id : undefined;
}

export function buildWatchlistAssetKey(input: Pick<WatchlistItemInput, "instrumentId" | "symbol" | "market" | "exchange" | "assetType">) {
  const instrumentId = inferInstrumentId(input);
  if (instrumentId) return `instrument:${instrumentId.toLowerCase()}`;
  return [input.market, input.exchange ?? "", input.assetType, normalizedSymbol(input.symbol)]
    .map((value) => value.trim().toLowerCase())
    .join(":");
}

export function normalizeWatchlistItem(input: WatchlistItemInput): WatchlistItem {
  const symbol = normalizedSymbol(input.symbol);
  const instrumentId = inferInstrumentId(input);
  const assetKey = input.assetKey?.trim() || buildWatchlistAssetKey(input);
  return {
    id: input.id?.trim() || newId("item"),
    assetKey,
    instrumentId,
    symbol,
    normalizedSymbol: input.normalizedSymbol?.trim().toUpperCase() || symbol,
    displaySymbol: input.displaySymbol?.trim() || symbol,
    providerSymbol: input.providerSymbol?.trim().toUpperCase() || undefined,
    bymaSymbol: input.bymaSymbol?.trim().toUpperCase() || undefined,
    name: input.name.trim() || symbol,
    assetType: input.assetType.trim() || "other",
    market: input.market.trim() || "unknown",
    exchange: input.exchange?.trim() || undefined,
    currency: input.currency.trim().toUpperCase() || "N/D",
    addedAt: input.addedAt ?? now(),
  };
}

function defaultStore(items: WatchlistItem[] = []): WatchlistStore {
  const timestamp = now();
  const id = newId("watchlist");
  return {
    version: WATCHLIST_SCHEMA_VERSION,
    activeWatchlistId: id,
    watchlists: [{ id, name: DEFAULT_WATCHLIST_NAME, items, createdAt: timestamp, updatedAt: timestamp }],
  };
}

function publicWatchlist(list: StoredWatchlist): Watchlist {
  return { id: list.id, name: list.name, itemCount: list.items.length, createdAt: list.createdAt, updatedAt: list.updatedAt };
}

function normalizeStoredList(value: Partial<StoredWatchlist>): StoredWatchlist | null {
  if (typeof value.id !== "string" || typeof value.name !== "string") return null;
  const timestamp = now();
  return {
    id: value.id,
    name: normalizeWatchlistName(value.name) || DEFAULT_WATCHLIST_NAME,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : timestamp,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : timestamp,
    items: Array.isArray(value.items)
      ? value.items.flatMap((item) => {
          try { return [normalizeWatchlistItem(item)]; } catch { return []; }
        }).filter((item, index, all) => all.findIndex((candidate) => candidate.assetKey === item.assetKey) === index)
      : [],
  };
}

function readLegacyItems(storage: StorageLike): WatchlistItem[] {
  try {
    const raw = storage.getItem(LEGACY_WATCHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Partial<WatchlistItemInput>>;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (typeof item.symbol !== "string" || typeof item.name !== "string") return [];
      return [normalizeWatchlistItem({
        symbol: item.symbol,
        displaySymbol: item.displaySymbol ?? item.symbol,
        name: item.name,
        assetType: item.assetType ?? "other",
        market: item.market ?? "unknown",
        exchange: item.exchange,
        currency: item.currency ?? "N/D",
        addedAt: item.addedAt,
      })];
    });
  } catch {
    return [];
  }
}

export class LocalStorageWatchlistRepository implements LocalWatchlistRepository {
  constructor(private readonly storage: StorageLike) {}

  private read(): WatchlistStore {
    try {
      const raw = this.storage.getItem(WATCHLIST_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<WatchlistStore>;
        const watchlists = Array.isArray(parsed.watchlists)
          ? parsed.watchlists.map(normalizeStoredList).filter((item): item is StoredWatchlist => Boolean(item))
          : [];
        if (watchlists.length) {
          const activeWatchlistId = watchlists.some((list) => list.id === parsed.activeWatchlistId)
            ? parsed.activeWatchlistId as string
            : watchlists[0].id;
          return { version: WATCHLIST_SCHEMA_VERSION, activeWatchlistId, watchlists };
        }
      }
    } catch {
      // Recover below with the legacy value or an empty default list.
    }

    const migrated = defaultStore(readLegacyItems(this.storage));
    this.write(migrated);
    this.storage.removeItem(LEGACY_WATCHLIST_STORAGE_KEY);
    return migrated;
  }

  private write(store: WatchlistStore) {
    this.storage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(store));
    if (typeof window !== "undefined") window.dispatchEvent(new Event(WATCHLIST_UPDATED_EVENT));
  }

  async getWatchlists() { return this.read().watchlists.map(publicWatchlist); }

  async getActiveWatchlistId() { return this.read().activeWatchlistId; }

  async setActiveWatchlistId(id: string) {
    const store = this.read();
    if (!store.watchlists.some((list) => list.id === id)) throw new Error("La lista seleccionada no existe.");
    this.write({ ...store, activeWatchlistId: id });
  }

  async createWatchlist(input: { name: string }) {
    const name = normalizeWatchlistName(input.name);
    if (!name) throw new Error("El nombre de la lista no puede estar vacío.");
    const store = this.read();
    if (store.watchlists.some((list) => comparableName(list.name) === comparableName(name))) {
      throw new Error("Ya existe una lista con ese nombre.");
    }
    const timestamp = now();
    const created: StoredWatchlist = { id: newId("watchlist"), name, items: [], createdAt: timestamp, updatedAt: timestamp };
    this.write({ ...store, activeWatchlistId: created.id, watchlists: [...store.watchlists, created] });
    return publicWatchlist(created);
  }

  async renameWatchlist(id: string, rawName: string) {
    const name = normalizeWatchlistName(rawName);
    if (!name) throw new Error("El nombre de la lista no puede estar vacío.");
    const store = this.read();
    if (store.watchlists.some((list) => list.id !== id && comparableName(list.name) === comparableName(name))) {
      throw new Error("Ya existe una lista con ese nombre.");
    }
    let renamed: StoredWatchlist | undefined;
    const watchlists = store.watchlists.map((list) => {
      if (list.id !== id) return list;
      renamed = { ...list, name, updatedAt: now() };
      return renamed;
    });
    if (!renamed) throw new Error("La lista no existe.");
    this.write({ ...store, watchlists });
    return publicWatchlist(renamed);
  }

  async deleteWatchlist(id: string) {
    const store = this.read();
    if (!store.watchlists.some((list) => list.id === id)) throw new Error("La lista no existe.");
    let watchlists = store.watchlists.filter((list) => list.id !== id);
    if (!watchlists.length) watchlists = defaultStore().watchlists;
    const activeWatchlistId = store.activeWatchlistId === id ? watchlists[0].id : store.activeWatchlistId;
    this.write({ version: WATCHLIST_SCHEMA_VERSION, activeWatchlistId, watchlists });
  }

  async getItems(watchlistId: string) {
    const list = this.read().watchlists.find((candidate) => candidate.id === watchlistId);
    if (!list) throw new Error("La lista no existe.");
    return list.items;
  }

  async addItem(watchlistId: string, input: WatchlistItemInput) {
    const item = normalizeWatchlistItem(input);
    const store = this.read();
    let result = item;
    let found = false;
    const watchlists = store.watchlists.map((list) => {
      if (list.id !== watchlistId) return list;
      found = true;
      const existing = list.items.find((candidate) => candidate.assetKey === item.assetKey);
      if (existing) { result = existing; return list; }
      return { ...list, items: [item, ...list.items], updatedAt: now() };
    });
    if (!found) throw new Error("La lista no existe.");
    this.write({ ...store, watchlists });
    return result;
  }

  async removeItem(watchlistId: string, itemId: string) {
    const store = this.read();
    const watchlists = store.watchlists.map((list) => list.id === watchlistId
      ? { ...list, items: list.items.filter((item) => item.id !== itemId), updatedAt: now() }
      : list);
    this.write({ ...store, watchlists });
  }

  async copyItem(itemId: string, toWatchlistId: string) {
    const store = this.read();
    const sourceItem = store.watchlists.flatMap((list) => list.items).find((item) => item.id === itemId);
    if (!sourceItem) throw new Error("El activo no existe.");
    const target = store.watchlists.find((list) => list.id === toWatchlistId);
    if (!target) throw new Error("La lista de destino no existe.");
    if (target.items.some((item) => item.assetKey === sourceItem.assetKey)) return;
    const copied = { ...sourceItem, id: newId("item"), addedAt: now() };
    const watchlists = store.watchlists.map((list) => list.id === toWatchlistId
      ? { ...list, items: [copied, ...list.items], updatedAt: now() }
      : list);
    this.write({ ...store, watchlists });
  }

  async moveItem(itemId: string, fromWatchlistId: string, toWatchlistId: string) {
    if (fromWatchlistId === toWatchlistId) return;
    const store = this.read();
    const source = store.watchlists.find((list) => list.id === fromWatchlistId);
    const target = store.watchlists.find((list) => list.id === toWatchlistId);
    const item = source?.items.find((candidate) => candidate.id === itemId);
    if (!source || !target || !item) throw new Error("No se pudo mover el activo.");
    const moved = target.items.some((candidate) => candidate.assetKey === item.assetKey)
      ? target.items
      : [{ ...item, id: newId("item"), addedAt: now() }, ...target.items];
    const timestamp = now();
    const watchlists = store.watchlists.map((list) => {
      if (list.id === fromWatchlistId) return { ...list, items: list.items.filter((candidate) => candidate.id !== itemId), updatedAt: timestamp };
      if (list.id === toWatchlistId) return { ...list, items: moved, updatedAt: timestamp };
      return list;
    });
    this.write({ ...store, watchlists });
  }

  async getMemberships(assetKey: string) {
    return this.read().watchlists.filter((list) => list.items.some((item) => item.assetKey === assetKey)).map(publicWatchlist);
  }
}

type RemoteListRow = { id: string; name: string; created_at: string; updated_at: string };
let authenticatedUserId: string | null = null;

export function setWatchlistUser(userId: string | null) {
  authenticatedUserId = userId;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(WATCHLIST_UPDATED_EVENT));
}

function remoteList(row: RemoteListRow, itemCount = 0): Watchlist {
  return { id: row.id, name: row.name, itemCount, createdAt: row.created_at, updatedAt: row.updated_at };
}

export class SupabaseWatchlistRepository implements LocalWatchlistRepository {
  private readonly supabase = createClient();
  private userId() { if (!authenticatedUserId) throw new Error("IniciÃ¡ sesiÃ³n para usar tus listas de cuenta."); return authenticatedUserId; }
  private activeKey() { return `cma-market-intelligence-active-watchlist:${this.userId()}`; }
  private async ensureDefault() {
    const userId = this.userId();
    const existing = await this.supabase.from("watchlists").select("id,name,created_at,updated_at").eq("user_id", userId).order("created_at", { ascending: true }).limit(1);
    if (existing.error) throw existing.error;
    if (existing.data?.[0]) return existing.data[0] as RemoteListRow;
    const created = await this.supabase.from("watchlists").insert({ user_id: userId, name: DEFAULT_WATCHLIST_NAME }).select("id,name,created_at,updated_at").single();
    if (created.error) throw created.error;
    return created.data as RemoteListRow;
  }
  async getWatchlists() {
    const userId = this.userId();
    const result = await this.supabase.from("watchlists").select("id,name,created_at,updated_at").eq("user_id", userId).order("created_at", { ascending: true });
    if (result.error) throw result.error;
    const rows = (result.data?.length ? result.data : [await this.ensureDefault()]) as RemoteListRow[];
    const counts = await this.supabase.from("watchlist_items").select("watchlist_id").eq("user_id", userId);
    if (counts.error) throw counts.error;
    const byList = new Map<string, number>();
    for (const row of (counts.data ?? []) as Array<{ watchlist_id: string }>) byList.set(row.watchlist_id, (byList.get(row.watchlist_id) ?? 0) + 1);
    return rows.map((row) => remoteList(row, byList.get(row.id) ?? 0));
  }
  async getActiveWatchlistId() { const lists = await this.getWatchlists(); const saved = typeof window !== "undefined" ? window.localStorage.getItem(this.activeKey()) : null; return lists.some((list) => list.id === saved) ? saved! : lists[0].id; }
  async setActiveWatchlistId(id: string) { const lists = await this.getWatchlists(); if (!lists.some((list) => list.id === id)) throw new Error("La lista seleccionada no existe."); if (typeof window !== "undefined") window.localStorage.setItem(this.activeKey(), id); }
  async createWatchlist(input: { name: string }) {
    const name = normalizeWatchlistName(input.name); if (!name) throw new Error("El nombre de la lista no puede estar vacío.");
    const result = await this.supabase.from("watchlists").insert({ user_id: this.userId(), name }).select("id,name,created_at,updated_at").single();
    if (result.error) throw new Error(result.error.code === "23505" ? "Ya existe una lista con ese nombre." : result.error.message);
    await this.setActiveWatchlistId(result.data.id); return remoteList(result.data as RemoteListRow);
  }
  async renameWatchlist(id: string, rawName: string) {
    const name = normalizeWatchlistName(rawName); if (!name) throw new Error("El nombre de la lista no puede estar vacío.");
    const result = await this.supabase.from("watchlists").update({ name, updated_at: now() }).eq("id", id).eq("user_id", this.userId()).select("id,name,created_at,updated_at").single();
    if (result.error) throw new Error(result.error.code === "23505" ? "Ya existe una lista con ese nombre." : result.error.message); return remoteList(result.data as RemoteListRow);
  }
  async deleteWatchlist(id: string) { if ((await this.getWatchlists()).length <= 1) throw new Error("ConservÃ¡ al menos una lista en tu cuenta."); const result = await this.supabase.from("watchlists").delete().eq("id", id).eq("user_id", this.userId()); if (result.error) throw result.error; }
  async getItems(watchlistId: string) { const result = await this.supabase.from("watchlist_items").select("id,asset_key,item,added_at").eq("watchlist_id", watchlistId).eq("user_id", this.userId()).order("added_at", { ascending: false }); if (result.error) throw result.error; return (result.data ?? []).map((row) => ({ ...normalizeWatchlistItem(row.item as WatchlistItemInput), id: row.id, assetKey: row.asset_key, addedAt: row.added_at })); }
  async addItem(watchlistId: string, input: WatchlistItemInput) {
    const item = normalizeWatchlistItem(input); const existing = await this.supabase.from("watchlist_items").select("id,asset_key,item,added_at").eq("watchlist_id", watchlistId).eq("user_id", this.userId()).eq("asset_key", item.assetKey).maybeSingle();
    if (existing.error) throw existing.error; if (existing.data) return { ...normalizeWatchlistItem(existing.data.item as WatchlistItemInput), id: existing.data.id, assetKey: existing.data.asset_key, addedAt: existing.data.added_at };
    const result = await this.supabase.from("watchlist_items").insert({ watchlist_id: watchlistId, user_id: this.userId(), asset_key: item.assetKey, item }).select("id,asset_key,item,added_at").single(); if (result.error) throw result.error; return { ...item, id: result.data.id, assetKey: result.data.asset_key, addedAt: result.data.added_at };
  }
  async removeItem(watchlistId: string, itemId: string) { const result = await this.supabase.from("watchlist_items").delete().eq("id", itemId).eq("watchlist_id", watchlistId).eq("user_id", this.userId()); if (result.error) throw result.error; }
  async copyItem(itemId: string, toWatchlistId: string) { const result = await this.supabase.from("watchlist_items").select("item").eq("id", itemId).eq("user_id", this.userId()).single(); if (result.error) throw result.error; await this.addItem(toWatchlistId, result.data.item as WatchlistItemInput); }
  async moveItem(itemId: string, fromWatchlistId: string, toWatchlistId: string) { if (fromWatchlistId === toWatchlistId) return; await this.copyItem(itemId, toWatchlistId); await this.removeItem(fromWatchlistId, itemId); }
  async getMemberships(assetKey: string) { const lists = await this.getWatchlists(); const memberships: Watchlist[] = []; for (const list of lists) if ((await this.getItems(list.id)).some((item) => item.assetKey === assetKey)) memberships.push(list); return memberships; }
}

function browserRepository() {
  if (typeof window === "undefined") return null;
  return new LocalStorageWatchlistRepository(window.localStorage);
}

export function getWatchlistRepository() {
  const repository = browserRepository();
  if (!repository) throw new Error("El almacenamiento de listas sÃ³lo estÃ¡ disponible en el navegador.");
  return authenticatedUserId ? new SupabaseWatchlistRepository() : repository;
}

// Compatibility helpers for the count badge and older call sites during migration.
export function readWatchlist(): WatchlistItem[] {
  if (typeof window === "undefined") return [];
  const repository = new LocalStorageWatchlistRepository(window.localStorage);
  const raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
  if (!raw) { void repository.getWatchlists(); }
  try {
    const store = JSON.parse(window.localStorage.getItem(WATCHLIST_STORAGE_KEY) ?? "null") as WatchlistStore | null;
    return store?.watchlists.find((list) => list.id === store.activeWatchlistId)?.items ?? [];
  } catch { return []; }
}

export function getWatchlistCount() {
  if (typeof window === "undefined") return 0;
  try {
    const repository = new LocalStorageWatchlistRepository(window.localStorage);
    void repository.getWatchlists();
    const store = JSON.parse(window.localStorage.getItem(WATCHLIST_STORAGE_KEY) ?? "null") as WatchlistStore | null;
    return new Set(store?.watchlists.flatMap((list) => list.items.map((item) => item.assetKey)) ?? []).size;
  } catch { return 0; }
}

export async function getWatchlistCountAsync() {
  try {
    const repository = getWatchlistRepository();
    const lists = await repository.getWatchlists();
    const items = await Promise.all(lists.map((list) => repository.getItems(list.id)));
    return new Set(items.flat().map((item) => item.assetKey)).size;
  } catch {
    return 0;
  }
}

export async function addWatchlistItem(input: WatchlistInput) {
  const repository = getWatchlistRepository();
  return repository.addItem(await repository.getActiveWatchlistId(), input);
}

export async function removeWatchlistItem(symbol: string) {
  const repository = getWatchlistRepository();
  const activeId = await repository.getActiveWatchlistId();
  const items = await repository.getItems(activeId);
  const item = items.find((candidate) => candidate.symbol === normalizedSymbol(symbol));
  if (item) await repository.removeItem(activeId, item.id);
  return repository.getItems(activeId);
}

export function isInWatchlist(symbol: string) {
  return readWatchlist().some((item) => item.symbol === normalizedSymbol(symbol));
}

export async function clearWatchlist() {
  const repository = getWatchlistRepository();
  const activeId = await repository.getActiveWatchlistId();
  const items = await repository.getItems(activeId);
  await Promise.all(items.map((item) => repository.removeItem(activeId, item.id)));
  return [];
}

