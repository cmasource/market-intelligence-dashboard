"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { SortDirection } from "@/lib/ui/sortable-table";

type SortableTableHeaderProps<Key extends string> = {
  columnKey: Key;
  label: string;
  activeKey: Key;
  direction: SortDirection;
  onSort: (key: Key) => void;
  align?: "left" | "right";
  className?: string;
};

export function SortableTableHeader<Key extends string>({
  columnKey,
  label,
  activeKey,
  direction,
  onSort,
  align = "left",
  className = "",
}: SortableTableHeaderProps<Key>) {
  const active = activeKey === columnKey;
  const Icon = active ? (direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <th
      scope="col"
      aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
      className={`px-4 py-2 ${align === "right" ? "text-right" : "text-left"} ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className={`inline-flex min-h-8 items-center gap-1.5 rounded px-1.5 text-xs font-semibold uppercase text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 ${align === "right" ? "ml-auto" : ""}`}
      >
        <span>{label}</span>
        <Icon size={13} aria-hidden="true" className={active ? "text-cyan-200" : "text-slate-600"} />
      </button>
    </th>
  );
}
