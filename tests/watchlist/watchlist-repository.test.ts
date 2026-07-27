import assert from "node:assert/strict";
import test from "node:test";
import {
  LEGACY_WATCHLIST_STORAGE_KEY,
  WATCHLIST_STORAGE_KEY,
  LocalStorageWatchlistRepository,
} from "@/lib/watchlist";

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

const aapl = {
  instrumentId: "stock:AAPL",
  symbol: "AAPL",
  displaySymbol: "AAPL",
  name: "Apple Inc.",
  assetType: "stock",
  market: "us",
  exchange: "NASDAQ",
  currency: "USD",
};

test("migrates the legacy flat watchlist into the default list", async () => {
  const storage = new MemoryStorage();
  storage.setItem(LEGACY_WATCHLIST_STORAGE_KEY, JSON.stringify([{ ...aapl, addedAt: "2026-01-01T00:00:00.000Z" }]));
  const repository = new LocalStorageWatchlistRepository(storage);
  const lists = await repository.getWatchlists();
  const items = await repository.getItems(lists[0].id);

  assert.equal(lists.length, 1);
  assert.equal(lists[0].name, "Mi lista");
  assert.equal(items[0].symbol, "AAPL");
  assert.equal(storage.getItem(LEGACY_WATCHLIST_STORAGE_KEY), null);
  assert.ok(storage.getItem(WATCHLIST_STORAGE_KEY));
});

test("normalizes names and rejects case-insensitive duplicates", async () => {
  const repository = new LocalStorageWatchlistRepository(new MemoryStorage());
  const created = await repository.createWatchlist({ name: "  Tecnología   global " });
  assert.equal(created.name, "Tecnología global");
  await assert.rejects(() => repository.createWatchlist({ name: "tecnologíaglobal" }), /Ya existe/);
  await assert.rejects(() => repository.createWatchlist({ name: "   " }), /vacío/);
});

test("copy and move remain atomic and never duplicate the same instrument", async () => {
  const repository = new LocalStorageWatchlistRepository(new MemoryStorage());
  const [origin] = await repository.getWatchlists();
  const destination = await repository.createWatchlist({ name: "Tecnología" });
  const item = await repository.addItem(origin.id, aapl);
  await repository.copyItem(item.id, destination.id);
  await repository.copyItem(item.id, destination.id);
  assert.equal((await repository.getItems(destination.id)).length, 1);

  await repository.moveItem(item.id, origin.id, destination.id);
  assert.equal((await repository.getItems(origin.id)).length, 0);
  assert.equal((await repository.getItems(destination.id)).length, 1);
});

test("deleting the last list recreates a valid default list", async () => {
  const repository = new LocalStorageWatchlistRepository(new MemoryStorage());
  const [onlyList] = await repository.getWatchlists();
  await repository.deleteWatchlist(onlyList.id);
  const lists = await repository.getWatchlists();
  assert.equal(lists.length, 1);
  assert.equal(lists[0].name, "Mi lista");
  assert.equal(await repository.getActiveWatchlistId(), lists[0].id);
});
