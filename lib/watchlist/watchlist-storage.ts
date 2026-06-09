import { WATCHLIST_STORAGE_KEY, WATCHLIST_UPDATED_EVENT, type WatchlistInput, type WatchlistItem } from "./watchlist-types";

function hasClientStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

function normalizeInput(input: WatchlistInput): WatchlistItem {
  return {
    symbol: normalizeSymbol(input.symbol),
    name: input.name.trim() || normalizeSymbol(input.symbol),
    assetType: input.assetType.trim() || "other",
    market: input.market.trim() || "unknown",
    currency: input.currency.trim() || "N/D",
    addedAt: input.addedAt ?? new Date().toISOString(),
  };
}

function notifyWatchlistUpdated() {
  if (!hasClientStorage()) return;
  window.dispatchEvent(new Event(WATCHLIST_UPDATED_EVENT));
}

export function readWatchlist(): WatchlistItem[] {
  if (!hasClientStorage()) return [];

  try {
    const raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WatchlistItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.symbol === "string" && typeof item.name === "string")
      .map((item) => normalizeInput(item));
  } catch {
    return [];
  }
}

export function writeWatchlist(items: WatchlistItem[]) {
  if (!hasClientStorage()) return;
  const normalized = items.map((item) => normalizeInput(item));
  window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(normalized));
  notifyWatchlistUpdated();
}

export function addWatchlistItem(input: WatchlistInput) {
  const item = normalizeInput(input);
  const current = readWatchlist();
  if (current.some((existing) => existing.symbol === item.symbol)) return current;
  const next = [item, ...current];
  writeWatchlist(next);
  return next;
}

export function removeWatchlistItem(symbol: string) {
  const normalized = normalizeSymbol(symbol);
  const next = readWatchlist().filter((item) => item.symbol !== normalized);
  writeWatchlist(next);
  return next;
}

export function clearWatchlist() {
  writeWatchlist([]);
  return [];
}

export function isInWatchlist(symbol: string) {
  const normalized = normalizeSymbol(symbol);
  return readWatchlist().some((item) => item.symbol === normalized);
}

export function getWatchlistCount() {
  return readWatchlist().length;
}
