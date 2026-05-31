"use client";

import type { HeatmapFilters, HeatmapSegment, HeatmapSort } from "@/lib/market/heatmap-types";
import type { FormatterLanguage } from "@/lib/formatters";

type HeatmapControlsProps = {
  filters: HeatmapFilters;
  language: FormatterLanguage;
  onChange: (filters: HeatmapFilters) => void;
};

const segments: Array<{ value: HeatmapSegment; en: string; es: string }> = [
  { value: "all", en: "All", es: "Todos" },
  { value: "usa", en: "USA", es: "USA" },
  { value: "cedears", en: "CEDEARs", es: "CEDEARs" },
  { value: "argentina", en: "Argentina", es: "Argentina" },
  { value: "bonds", en: "Bonds", es: "Bonos" },
  { value: "crypto", en: "Crypto", es: "Cripto" },
  { value: "etfs", en: "ETFs", es: "ETFs" },
];

const sortOptions: Array<{ value: HeatmapSort; en: string; es: string }> = [
  { value: "change", en: "Variation", es: "Variacion" },
  { value: "absoluteChange", en: "Biggest move", es: "Mayor movimiento" },
  { value: "symbol", en: "Symbol", es: "Simbolo" },
  { value: "source", en: "Source", es: "Fuente" },
];

export function HeatmapControls({ filters, language, onChange }: HeatmapControlsProps) {
  const isSpanish = language === "es";

  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/35 p-3 md:grid-cols-[1fr_1fr_auto]">
      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {isSpanish ? "Segmento" : "Segment"}
        <select
          value={filters.segment}
          onChange={(event) => onChange({ ...filters, segment: event.target.value as HeatmapSegment })}
          className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-white outline-none transition focus:border-cyan-300/60"
        >
          {segments.map((segment) => (
            <option key={segment.value} value={segment.value}>
              {segment[language]}
            </option>
          ))}
        </select>
      </label>

      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {isSpanish ? "Ordenar por" : "Sort by"}
        <select
          value={filters.sort}
          onChange={(event) => onChange({ ...filters, sort: event.target.value as HeatmapSort })}
          className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm normal-case tracking-normal text-white outline-none transition focus:border-cyan-300/60"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option[language]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex min-h-[70px] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-200">
        <input
          type="checkbox"
          checked={filters.includeSimulated}
          onChange={(event) => onChange({ ...filters, includeSimulated: event.target.checked })}
          className="h-4 w-4 accent-cyan-300"
        />
        <span>
          <span className="block font-semibold">{isSpanish ? "Incluir simulados" : "Include simulated"}</span>
          <span className="block text-xs text-slate-400">
            {isSpanish ? "Solo datos reales/manuales si esta desactivado." : "Only provider/manual data when off."}
          </span>
        </span>
      </label>
    </div>
  );
}
