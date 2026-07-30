import assert from "node:assert/strict";
import test from "node:test";
import { sortTableRows } from "@/lib/ui/sortable-table";

const rows = [
  { symbol: "BBB", price: null },
  { symbol: "CCC", price: 20 },
  { symbol: "AAA", price: 10 },
];

test("sortable tables order text alphabetically", () => {
  const sorted = sortTableRows<(typeof rows)[number], "symbol" | "price">(rows, { key: "symbol", direction: "asc" }, {
    symbol: (row) => row.symbol,
    price: (row) => row.price,
  });
  assert.deepEqual(sorted.map((row) => row.symbol), ["AAA", "BBB", "CCC"]);
});

test("sortable tables keep unavailable numeric values last in both directions", () => {
  const accessors = { symbol: (row: typeof rows[number]) => row.symbol, price: (row: typeof rows[number]) => row.price };
  const ascending = sortTableRows(rows, { key: "price", direction: "asc" }, accessors);
  const descending = sortTableRows(rows, { key: "price", direction: "desc" }, accessors);
  assert.deepEqual(ascending.map((row) => row.symbol), ["AAA", "CCC", "BBB"]);
  assert.deepEqual(descending.map((row) => row.symbol), ["CCC", "AAA", "BBB"]);
});
