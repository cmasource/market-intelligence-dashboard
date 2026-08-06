import assert from "node:assert/strict";
import test from "node:test";
import { importWatchlists, LocalStorageWatchlistRepository } from "../../lib/watchlist/watchlist-storage";

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

test("explicit watchlist import preserves names and dates, skips duplicates and is idempotent", async () => {
  const source = new LocalStorageWatchlistRepository(new MemoryStorage());
  const target = new LocalStorageWatchlistRepository(new MemoryStorage());
  const sourceList = (await source.getWatchlists())[0];
  await source.renameWatchlist(sourceList.id, "Tecnología");
  await source.addItem(sourceList.id, { instrumentId: "us-stock-aapl", symbol: "AAPL", name: "Apple", assetType: "stock", market: "us", exchange: "NASDAQ", currency: "USD", addedAt: "2026-07-01T12:00:00.000Z" });
  const first = await importWatchlists(source, target);
  const second = await importWatchlists(source, target);
  assert.equal(first.itemsImported, 1);
  assert.equal(second.itemsImported, 0);
  assert.equal(second.itemsSkipped, 1);
  const importedList = (await target.getWatchlists()).find((list) => list.name === "Tecnología")!;
  const importedItems = await target.getItems(importedList.id);
  assert.equal(importedItems[0].addedAt, "2026-07-01T12:00:00.000Z");
  assert.equal(importedItems.length, 1);
});

