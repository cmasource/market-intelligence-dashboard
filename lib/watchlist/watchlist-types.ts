export const LEGACY_WATCHLIST_STORAGE_KEY = "cma-market-intelligence-watchlist";
export const WATCHLIST_STORAGE_KEY = "cma-market-intelligence-watchlists-v2";
export const WATCHLIST_UPDATED_EVENT = "cma-watchlists-updated";
export const WATCHLIST_IMPORT_DECISION_KEY = "cma-watchlist-import-decision-v1";
export const DEFAULT_WATCHLIST_NAME = "Mi lista";
export const WATCHLIST_SCHEMA_VERSION = 2;

export type WatchlistItem = {
  id: string;
  assetKey: string;
  instrumentId?: string;
  symbol: string;
  normalizedSymbol: string;
  displaySymbol: string;
  providerSymbol?: string;
  bymaSymbol?: string;
  name: string;
  assetType: string;
  market: string;
  exchange?: string;
  currency: string;
  addedAt: string;
};

export type WatchlistItemInput = Omit<WatchlistItem, "id" | "assetKey" | "normalizedSymbol" | "displaySymbol" | "addedAt"> & {
  id?: string;
  assetKey?: string;
  normalizedSymbol?: string;
  displaySymbol?: string;
  addedAt?: string;
};

/** Compatibility alias used by existing asset cards. */
export type WatchlistInput = WatchlistItemInput;

export type Watchlist = {
  id: string;
  name: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateWatchlistInput = { name: string };

export type StoredWatchlist = Omit<Watchlist, "itemCount"> & { items: WatchlistItem[] };

export type WatchlistStore = {
  version: typeof WATCHLIST_SCHEMA_VERSION;
  activeWatchlistId: string;
  watchlists: StoredWatchlist[];
};

export interface WatchlistRepository {
  getWatchlists(): Promise<Watchlist[]>;
  createWatchlist(input: CreateWatchlistInput): Promise<Watchlist>;
  renameWatchlist(id: string, name: string): Promise<Watchlist>;
  deleteWatchlist(id: string): Promise<void>;
  getItems(watchlistId: string): Promise<WatchlistItem[]>;
  addItem(watchlistId: string, item: WatchlistItemInput): Promise<WatchlistItem>;
  removeItem(watchlistId: string, itemId: string): Promise<void>;
  moveItem(itemId: string, fromWatchlistId: string, toWatchlistId: string): Promise<void>;
  copyItem(itemId: string, toWatchlistId: string): Promise<void>;
}

export interface LocalWatchlistRepository extends WatchlistRepository {
  getActiveWatchlistId(): Promise<string>;
  setActiveWatchlistId(id: string): Promise<void>;
  getMemberships(assetKey: string): Promise<Watchlist[]>;
}

export type WatchlistImportResult = {
  listsCreated: number;
  itemsImported: number;
  itemsSkipped: number;
  errors: string[];
};
