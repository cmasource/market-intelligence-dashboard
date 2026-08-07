"use client";

import { useEffect, useMemo, useState } from "react";
import { AccessibleDialog } from "@/components/ui/AccessibleDialog";
import { useInstrumentSearch } from "@/lib/hooks/useInstrumentSearch";
import { createClient } from "@/lib/supabase/client";
import { savePersonalAlertSubscription } from "@/lib/alerts/client";
import type { PersonalAlertCondition } from "@/lib/alerts";
import { getWatchlistRepository, setWatchlistUser, watchlistItemFromInstrument, type Watchlist, type WatchlistItem } from "@/lib/watchlist";
import type { InstrumentSearchResult } from "@/lib/instruments/types";

type Props = {
  open: boolean;
  watchlists: Watchlist[];
  initialItem?: WatchlistItem | null;
  initialWatchlistId?: string | null;
  onClose: () => void;
  onSaved?: () => void;
};

const OPTIONS: Array<{ value: PersonalAlertCondition; label: string; help: string }> = [
  { value: "price_above", label: "Precio alcanza o supera", help: "Se activa cuando el cierre cruza hacia arriba el precio configurado." },
  { value: "price_below", label: "Precio alcanza o cae por debajo", help: "Se activa cuando el cierre cruza hacia abajo el precio configurado." },
  { value: "rapid_rise", label: "Suba brusca", help: "Compara la variación del último cierre con el porcentaje elegido." },
  { value: "rapid_fall", label: "Baja brusca", help: "Compara la caída del último cierre con el porcentaje elegido." },
  { value: "near_ema200", label: "Cerca de la EMA 200", help: "Se activa cuando el cierre queda dentro del margen porcentual de la EMA 200." },
  { value: "near_period_low", label: "Cerca del mínimo del período", help: "Usa el mínimo verificable del período seleccionado; no afirma ser el mínimo histórico absoluto." },
  { value: "near_period_high", label: "Cerca del máximo del período", help: "Usa el máximo verificable del período seleccionado." },
];

const SUPPORTED_TYPES = new Set(["stock", "etf", "adr", "cedear", "cedear_etf", "crypto"]);

export function AlertComposerDialog({ open, watchlists, initialItem, initialWatchlistId, onClose, onSaved }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<InstrumentSearchResult | null>(null);
  const [watchlistId, setWatchlistId] = useState(initialWatchlistId ?? watchlists[0]?.id ?? "");
  const [condition, setCondition] = useState<PersonalAlertCondition>("price_above");
  const [value, setValue] = useState("");
  const [lookbackBars, setLookbackBars] = useState("200");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { results, loading, error } = useInstrumentSearch(query, open && !initialItem && !selected);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      setWatchlistId(initialWatchlistId ?? watchlists[0]?.id ?? "");
      setSelected(null);
      setQuery("");
      setCondition("price_above");
      setValue("");
      setLookbackBars("200");
      setMessage(null);
    });
  }, [initialWatchlistId, open, watchlists]);

  const selectedType = initialItem?.assetType ?? selected?.assetClass ?? "";
  const supported = SUPPORTED_TYPES.has(selectedType);
  const option = OPTIONS.find((candidate) => candidate.value === condition)!;
  const isPrice = condition === "price_above" || condition === "price_below";
  const isPeriod = condition === "near_period_low" || condition === "near_period_high";
  const numericValue = Number(value.replace(",", "."));
  const valid = Boolean(watchlistId && (initialItem || selected) && supported && Number.isFinite(numericValue) && numericValue > 0 && (isPrice || numericValue <= 50));
  const availableLists = useMemo(() => watchlists.filter((list) => list.id), [watchlists]);

  async function save() {
    if (!valid) return;
    setBusy(true);
    setMessage(null);
    try {
      const { data } = await createClient().auth.getUser();
      if (!data.user) throw new Error("Iniciá sesión para crear una alerta.");
      setWatchlistUser(data.user.id);
      const repository = getWatchlistRepository();
      let item = initialItem ?? null;
      if (!item && selected) {
        const input = watchlistItemFromInstrument(selected);
        const existing = (await repository.getItems(watchlistId)).find((candidate) => candidate.instrumentId === selected.id);
        item = existing ?? await repository.addItem(watchlistId, input);
      }
      if (!item) throw new Error("No se pudo identificar el instrumento.");
      await savePersonalAlertSubscription({
        userId: data.user.id,
        watchlistId,
        item,
        condition,
        targetValue: isPrice ? numericValue : null,
        thresholdPercent: isPrice ? null : numericValue,
        lookbackBars: isPeriod ? Number(lookbackBars) : null,
      });
      setMessage(`Alerta configurada para ${item.displaySymbol}.`);
      onSaved?.();
    } catch (requestError) {
      setMessage(requestError instanceof Error ? requestError.message : "No se pudo guardar la alerta.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AccessibleDialog open={open} onClose={onClose} title="Crear alerta" description="Elegí el instrumento y una condición determinística. Las alertas usan datos OHLCV verificables y nunca ejecutan operaciones.">
      {!initialItem && !selected ? (
        <div>
          <label htmlFor="alert-instrument-search" className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cma-text-muted)]">Buscar instrumento</label>
          <input id="alert-instrument-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej. MSFT, YPF, BTC" autoComplete="off" className="mt-2 min-h-11 w-full rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] px-3 text-sm outline-none focus:border-[var(--cma-border-strong)]" />
          <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
            {loading ? <p className="p-3 text-sm text-[var(--cma-text-muted)]">Buscando…</p> : null}
            {error ? <p className="p-3 text-sm text-amber-200">Búsqueda no disponible: {error}</p> : null}
            {results.map((instrument) => <button key={instrument.id} type="button" onClick={() => setSelected(instrument)} className="flex min-h-14 w-full items-center justify-between rounded-lg border border-[var(--cma-border-soft)] px-3 py-2 text-left hover:border-[var(--cma-border-strong)]"><span><strong className="font-mono">{instrument.displaySymbol}</strong><span className="mt-1 block text-xs text-[var(--cma-text-secondary)]">{instrument.name}</span></span><span className="text-xs text-[var(--cma-text-muted)]">{instrument.assetClass}</span></button>)}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] p-3">
          <span><strong className="font-mono">{initialItem?.displaySymbol ?? selected?.displaySymbol}</strong><span className="mt-1 block text-xs text-[var(--cma-text-secondary)]">{initialItem?.name ?? selected?.name}</span></span>
          {!initialItem ? <button type="button" onClick={() => setSelected(null)} className="min-h-11 px-3 text-sm text-cyan-100">Cambiar</button> : null}
        </div>
      )}

      {(initialItem || selected) ? <div className="mt-4 grid gap-4">
        {!supported ? <p role="alert" className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">Este tipo de activo todavía no tiene datos técnicos suficientes para alertas configurables.</p> : null}
        <label className="grid gap-2 text-sm">Lista monitoreada<select value={watchlistId} onChange={(event) => setWatchlistId(event.target.value)} disabled={Boolean(initialItem)} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] px-3">{availableLists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}</select></label>
        <label className="grid gap-2 text-sm">Condición<select value={condition} onChange={(event) => { setCondition(event.target.value as PersonalAlertCondition); setValue(""); }} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] px-3">{OPTIONS.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}</select></label>
        <p className="text-xs leading-5 text-[var(--cma-text-muted)]">{option.help}</p>
        <label className="grid gap-2 text-sm">{isPrice ? `Precio objetivo (${initialItem?.currency ?? selected?.currency})` : "Margen o variación (%)"}<input inputMode="decimal" value={value} onChange={(event) => setValue(event.target.value)} placeholder={isPrice ? "Ej. 550" : condition.includes("rapid") ? "Ej. 5" : "Ej. 1"} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] px-3" /></label>
        {isPeriod ? <label className="grid gap-2 text-sm">Período<select value={lookbackBars} onChange={(event) => setLookbackBars(event.target.value)} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] px-3"><option value="20">20 ruedas</option><option value="60">60 ruedas</option><option value="120">120 ruedas</option><option value="200">200 ruedas</option></select></label> : null}
        <button type="button" disabled={!valid || busy} onClick={() => void save()} className="min-h-11 rounded-lg border border-cyan-300/35 bg-cyan-300/10 px-4 text-sm font-semibold text-cyan-100 disabled:opacity-40">{busy ? "Guardando…" : "Guardar alerta"}</button>
      </div> : null}
      {message ? <p role="status" className="mt-4 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] p-3 text-sm">{message}</p> : null}
    </AccessibleDialog>
  );
}
