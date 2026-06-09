export const WATCHLIST_STORAGE_KEY = "cma-market-intelligence-watchlist";
export const WATCHLIST_UPDATED_EVENT = "cma-watchlist-updated";

export type WatchlistItem = {
  symbol: string;
  name: string;
  assetType: string;
  market: string;
  currency: string;
  addedAt: string;
};

export type WatchlistInput = Omit<WatchlistItem, "addedAt"> & {
  addedAt?: string;
};
