export type SortDirection = "asc" | "desc";
export type SortValue = string | number | boolean | Date | null | undefined;
export type SortState<Key extends string> = { key: Key; direction: SortDirection };

function normalizedValue(value: SortValue) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") return value.trim().toLocaleLowerCase("es");
  if (typeof value === "boolean") return value ? 1 : 0;
  return value;
}

export function compareSortValues(left: SortValue, right: SortValue, direction: SortDirection) {
  const a = normalizedValue(left);
  const b = normalizedValue(right);
  const aMissing = a === null || a === undefined || a === "" || (typeof a === "number" && !Number.isFinite(a));
  const bMissing = b === null || b === undefined || b === "" || (typeof b === "number" && !Number.isFinite(b));

  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;

  const result = typeof a === "number" && typeof b === "number"
    ? a - b
    : String(a).localeCompare(String(b), "es", { numeric: true, sensitivity: "base" });
  return direction === "asc" ? result : -result;
}

export function sortTableRows<Row, Key extends string>(
  rows: Row[],
  sort: SortState<Key>,
  accessors: Record<Key, (row: Row) => SortValue>,
) {
  const accessor = accessors[sort.key];
  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => compareSortValues(accessor(left.row), accessor(right.row), sort.direction) || left.index - right.index)
    .map(({ row }) => row);
}

export function nextSortState<Key extends string>(current: SortState<Key>, key: Key, initialDirection: SortDirection = "asc"): SortState<Key> {
  if (current.key !== key) return { key, direction: initialDirection };
  return { key, direction: current.direction === "asc" ? "desc" : "asc" };
}
