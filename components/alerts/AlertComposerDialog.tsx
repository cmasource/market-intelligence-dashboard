"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Info, Search, ShieldCheck } from "lucide-react";
import { AccessibleDialog } from "@/components/ui/AccessibleDialog";
import { useInstrumentSearch } from "@/lib/hooks/useInstrumentSearch";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { createClient } from "@/lib/supabase/client";
import { savePersonalAlertSubscription } from "@/lib/alerts/client";
import {
  PERSONAL_ALERT_CONDITIONS,
  personalAlertConditionCopy,
  personalAlertSchedule,
} from "@/lib/alerts/presentation";
import type { PersonalAlertCondition, PersonalAlertSubscription } from "@/lib/alerts";
import { getWatchlistRepository, setWatchlistUser, watchlistItemFromInstrument, type Watchlist, type WatchlistItem } from "@/lib/watchlist";
import type { InstrumentSearchResult } from "@/lib/instruments/types";

type Props = {
  open: boolean;
  watchlists: Watchlist[];
  initialItem?: WatchlistItem | null;
  initialWatchlistId?: string | null;
  initialSubscription?: PersonalAlertSubscription | null;
  onClose: () => void;
  onSaved?: () => void;
};

const SUPPORTED_TYPES = new Set(["stock", "etf", "adr", "cedear", "cedear_etf", "crypto"]);

function itemFromSubscription(subscription: PersonalAlertSubscription): WatchlistItem {
  return {
    id: subscription.watchlistItemId,
    assetKey: subscription.instrumentId,
    instrumentId: subscription.instrumentId,
    symbol: subscription.instrumentSymbol,
    normalizedSymbol: subscription.instrumentSymbol.toUpperCase(),
    displaySymbol: subscription.instrumentSymbol,
    name: subscription.instrumentName,
    assetType: subscription.assetType,
    market: subscription.market,
    exchange: subscription.exchange ?? undefined,
    currency: subscription.currency,
    addedAt: subscription.createdAt,
  };
}

export function AlertComposerDialog({ open, watchlists, initialItem, initialWatchlistId, initialSubscription, onClose, onSaved }: Props) {
  const { language } = useLanguage();
  const uiLanguage = language === "en" ? "en" : "es";
  const editing = Boolean(initialSubscription);
  const subscriptionItem = initialSubscription ? itemFromSubscription(initialSubscription) : null;
  const fixedItem = initialItem ?? subscriptionItem;
  const firstWatchlistId = watchlists[0]?.id ?? "";
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<InstrumentSearchResult | null>(null);
  const [watchlistId, setWatchlistId] = useState(initialSubscription?.watchlistId ?? initialWatchlistId ?? firstWatchlistId);
  const [condition, setCondition] = useState<PersonalAlertCondition>(initialSubscription?.condition ?? "price_above");
  const [value, setValue] = useState("");
  const [lookbackBars, setLookbackBars] = useState("200");
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const { results, loading, error } = useInstrumentSearch(query, open && !fixedItem && !selected);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      const nextCondition = initialSubscription?.condition ?? "price_above";
      const nextValue = initialSubscription?.targetValue ?? initialSubscription?.thresholdPercent;
      setWatchlistId(initialSubscription?.watchlistId ?? initialWatchlistId ?? firstWatchlistId);
      setSelected(null);
      setQuery("");
      setCondition(nextCondition);
      setValue(nextValue === null || nextValue === undefined ? personalAlertConditionCopy(nextCondition, uiLanguage).defaultValue : String(nextValue));
      setLookbackBars(String(initialSubscription?.lookbackBars ?? 200));
      setMessage(null);
      setTouched(false);
    });
  }, [firstWatchlistId, initialSubscription, initialWatchlistId, open, uiLanguage]);

  const selectedItem = fixedItem;
  const selectedType = selectedItem?.assetType ?? selected?.assetClass ?? "";
  const selectedMarket = selectedItem?.market ?? selected?.market ?? "";
  const selectedCurrency = selectedItem?.currency ?? selected?.currency ?? "";
  const supported = SUPPORTED_TYPES.has(selectedType);
  const copy = personalAlertConditionCopy(condition, uiLanguage);
  const isPrice = condition === "price_above" || condition === "price_below";
  const isPeriod = condition === "near_period_low" || condition === "near_period_high";
  const numericValue = Number(value.replace(",", "."));
  const valueValid = Number.isFinite(numericValue) && numericValue > 0 && (isPrice || numericValue <= 50);
  const valid = Boolean(watchlistId && (selectedItem || selected) && supported && valueValid);
  const availableLists = useMemo(() => watchlists.filter((list) => list.id), [watchlists]);
  const instrumentLabel = selectedItem?.displaySymbol ?? selected?.displaySymbol ?? "";
  const instrumentName = selectedItem?.name ?? selected?.name ?? "";
  const schedule = personalAlertSchedule(selectedType, selectedMarket, uiLanguage);
  const validationMessage = !value.trim()
    ? (uiLanguage === "es" ? "Completá este valor para activar el botón." : "Enter a value to enable the button.")
    : !valueValid
      ? (uiLanguage === "es" ? (isPrice ? "Ingresá un precio mayor que cero." : "Ingresá un porcentaje entre 0,1 y 50.") : (isPrice ? "Enter a price above zero." : "Enter a percentage between 0.1 and 50."))
      : null;

  function changeCondition(nextCondition: PersonalAlertCondition) {
    setCondition(nextCondition);
    setValue(personalAlertConditionCopy(nextCondition, uiLanguage).defaultValue);
    setTouched(false);
    setMessage(null);
  }

  async function save() {
    setTouched(true);
    if (!valid) return;
    setBusy(true);
    setMessage(null);
    try {
      const { data } = await createClient().auth.getUser();
      if (!data.user) throw new Error(uiLanguage === "es" ? "Iniciá sesión para crear una alerta." : "Sign in to create an alert.");
      setWatchlistUser(data.user.id);
      const repository = getWatchlistRepository();
      let item = selectedItem;
      if (!item && selected) {
        const input = watchlistItemFromInstrument(selected);
        const existing = (await repository.getItems(watchlistId)).find((candidate) => candidate.instrumentId === selected.id);
        item = existing ?? await repository.addItem(watchlistId, input);
      }
      if (!item) throw new Error(uiLanguage === "es" ? "No se pudo identificar el instrumento." : "The instrument could not be identified.");
      await savePersonalAlertSubscription({
        userId: data.user.id,
        watchlistId,
        item,
        condition,
        targetValue: isPrice ? numericValue : null,
        thresholdPercent: isPrice ? null : numericValue,
        lookbackBars: isPeriod ? Number(lookbackBars) : null,
      });
      setMessage({ type: "success", text: uiLanguage === "es" ? `Alerta ${editing ? "actualizada" : "configurada"} para ${item.displaySymbol}.` : `Alert ${editing ? "updated" : "created"} for ${item.displaySymbol}.` });
      onSaved?.();
    } catch (requestError) {
      setMessage({ type: "error", text: requestError instanceof Error ? requestError.message : (uiLanguage === "es" ? "No se pudo guardar la alerta." : "The alert could not be saved.") });
    } finally {
      setBusy(false);
    }
  }

  const title = editing ? (uiLanguage === "es" ? "Editar alerta" : "Edit alert") : (uiLanguage === "es" ? "Crear alerta" : "Create alert");
  const description = uiLanguage === "es"
    ? "Definí una condición clara. Se evaluará con cierres OHLCV verificables y nunca ejecutará operaciones."
    : "Define a clear condition. It will use verifiable OHLCV closes and will never execute trades.";

  return (
    <AccessibleDialog open={open} onClose={onClose} title={title} description={description}>
      <ol aria-label={uiLanguage === "es" ? "Pasos para configurar la alerta" : "Alert setup steps"} className="mb-5 grid grid-cols-3 gap-2 text-[11px] sm:text-xs">
        {[
          uiLanguage === "es" ? "1. Activo" : "1. Asset",
          uiLanguage === "es" ? "2. Condición" : "2. Condition",
          uiLanguage === "es" ? "3. Confirmar" : "3. Confirm",
        ].map((step, index) => <li key={step} className={`rounded-full border px-2 py-1.5 text-center ${index === 0 && !(selectedItem || selected) ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100" : selectedItem || selected ? "border-emerald-300/25 text-[var(--cma-text-secondary)]" : "border-[var(--cma-border-soft)] text-[var(--cma-text-muted)]"}`}>{step}</li>)}
      </ol>

      {!selectedItem && !selected ? (
        <div>
          <label htmlFor="alert-instrument-search" className="text-sm font-semibold text-[var(--cma-text-primary)]">{uiLanguage === "es" ? "Buscar activo" : "Search asset"}</label>
          <div className="relative mt-2"><Search aria-hidden="true" size={17} className="pointer-events-none absolute left-3 top-3.5 text-[var(--cma-text-muted)]" /><input id="alert-instrument-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={uiLanguage === "es" ? "Ticker o nombre, por ejemplo MSFT" : "Ticker or name, for example MSFT"} autoComplete="off" className="min-h-11 w-full rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] pl-10 pr-3 text-sm outline-none focus:border-[var(--cma-border-strong)]" /></div>
          <p className="mt-2 text-xs text-[var(--cma-text-muted)]">{uiLanguage === "es" ? "Usamos el mismo catálogo de Instrument Master que Trade Radar." : "Uses the same Instrument Master catalog as Trade Radar."}</p>
          <div className="mt-3 max-h-56 space-y-2 overflow-y-auto" aria-live="polite">
            {loading ? <p className="p-3 text-sm text-[var(--cma-text-muted)]">{uiLanguage === "es" ? "Buscando…" : "Searching…"}</p> : null}
            {error ? <p className="p-3 text-sm text-amber-200">{uiLanguage === "es" ? "Búsqueda no disponible" : "Search unavailable"}: {error}</p> : null}
            {query.trim().length >= 2 && !loading && !error && !results.length ? <p className="rounded-lg border border-dashed border-[var(--cma-border-soft)] p-4 text-sm text-[var(--cma-text-muted)]">{uiLanguage === "es" ? "No encontramos instrumentos para esa búsqueda." : "No instruments matched your search."}</p> : null}
            {results.map((instrument) => <button key={instrument.id} type="button" onClick={() => setSelected(instrument)} className="flex min-h-14 w-full items-center justify-between rounded-lg border border-[var(--cma-border-soft)] px-3 py-2 text-left hover:border-[var(--cma-border-strong)] focus-visible:border-cyan-300"><span><strong className="font-mono">{instrument.displaySymbol}</strong><span className="mt-1 block text-xs text-[var(--cma-text-secondary)]">{instrument.name}</span></span><span className="rounded-full border border-[var(--cma-border-soft)] px-2 py-1 text-[10px] uppercase text-[var(--cma-text-muted)]">{instrument.assetClass}</span></button>)}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-3">
          <span><span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-200">{uiLanguage === "es" ? "Activo monitoreado" : "Monitored asset"}</span><strong className="mt-1 block font-mono">{instrumentLabel}</strong><span className="mt-1 block text-xs text-[var(--cma-text-secondary)]">{instrumentName}</span></span>
          {!fixedItem ? <button type="button" onClick={() => setSelected(null)} className="min-h-11 rounded-lg px-3 text-sm font-medium text-cyan-100">{uiLanguage === "es" ? "Cambiar" : "Change"}</button> : null}
        </div>
      )}

      {(selectedItem || selected) ? <div className="mt-4 grid gap-4">
        {!supported ? <p role="alert" className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">{uiLanguage === "es" ? "Este tipo de activo todavía no tiene datos técnicos suficientes para alertas configurables." : "This asset type does not yet have enough technical data for configurable alerts."}</p> : null}
        {!availableLists.length ? <p role="alert" className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">{uiLanguage === "es" ? "Primero necesitás una lista para asociar la alerta." : "Create a watchlist before adding an alert."} <Link href="/watchlist" className="font-semibold underline">{uiLanguage === "es" ? "Ir a Mis listas" : "Go to watchlists"}</Link></p> : null}

        <label className="grid gap-2 text-sm font-medium">{uiLanguage === "es" ? "Lista monitoreada" : "Monitored list"}<select value={watchlistId} onChange={(event) => setWatchlistId(event.target.value)} disabled={Boolean(fixedItem)} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] px-3 font-normal disabled:opacity-70">{availableLists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}</select></label>
        <label className="grid gap-2 text-sm font-medium">{uiLanguage === "es" ? "¿Qué querés monitorear?" : "What do you want to monitor?"}<select value={condition} onChange={(event) => changeCondition(event.target.value as PersonalAlertCondition)} disabled={editing} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] px-3 font-normal disabled:opacity-70">{PERSONAL_ALERT_CONDITIONS.map((entry) => <option key={entry} value={entry}>{personalAlertConditionCopy(entry, uiLanguage).label}</option>)}</select></label>
        {editing ? <p className="-mt-2 text-xs text-[var(--cma-text-muted)]">{uiLanguage === "es" ? "Para cambiar el tipo de condición, creá una alerta nueva." : "Create a new alert to use a different condition type."}</p> : null}

        <div className="rounded-xl border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] p-4">
          <div className="flex gap-3"><Info aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-cyan-200" /><div><p className="text-sm font-medium">{copy.description}</p><p id="alert-condition-example" className="mt-1 text-xs leading-5 text-[var(--cma-text-muted)]">{copy.example}</p></div></div>
        </div>

        <label className="grid gap-2 text-sm font-medium">{copy.inputLabel}{isPrice ? ` (${selectedCurrency})` : ""}<input inputMode="decimal" value={value} onChange={(event) => { setValue(event.target.value); setMessage(null); }} onBlur={() => setTouched(true)} placeholder={copy.placeholder} aria-describedby="alert-condition-example alert-value-feedback" aria-invalid={touched && Boolean(validationMessage)} className="min-h-12 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] px-3 text-base outline-none focus:border-cyan-300 aria-[invalid=true]:border-rose-300/60" /></label>
        <p id="alert-value-feedback" className={`-mt-2 text-xs ${touched && validationMessage ? "text-rose-200" : "text-[var(--cma-text-muted)]"}`}>{touched && validationMessage ? validationMessage : (isPrice ? (uiLanguage === "es" ? "Usá la misma moneda indicada junto al campo." : "Use the currency shown next to the field.") : (uiLanguage === "es" ? "Podés usar coma o punto decimal. Valores habituales: 0,5%, 1% o 2%." : "You can use a decimal point or comma. Common values: 0.5%, 1%, or 2%."))}</p>

        {isPeriod ? <label className="grid gap-2 text-sm font-medium">{uiLanguage === "es" ? "Período de referencia" : "Reference period"}<select value={lookbackBars} onChange={(event) => setLookbackBars(event.target.value)} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] px-3 font-normal"><option value="20">20 {uiLanguage === "es" ? "ruedas" : "sessions"}</option><option value="60">60 {uiLanguage === "es" ? "ruedas" : "sessions"}</option><option value="120">120 {uiLanguage === "es" ? "ruedas" : "sessions"}</option><option value="200">200 {uiLanguage === "es" ? "ruedas" : "sessions"}</option></select></label> : null}

        <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/5 p-4" aria-label={uiLanguage === "es" ? "Resumen de la alerta" : "Alert summary"}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200">{uiLanguage === "es" ? "Antes de guardar" : "Before saving"}</p>
          <p className="mt-2 text-sm font-medium">{instrumentLabel} · {copy.label}</p>
          <div className="mt-3 grid gap-2 text-xs text-[var(--cma-text-secondary)]"><p className="flex items-start gap-2"><Clock3 aria-hidden="true" size={15} className="mt-0.5 shrink-0" />{schedule}</p><p className="flex items-start gap-2"><ShieldCheck aria-hidden="true" size={15} className="mt-0.5 shrink-0" />{uiLanguage === "es" ? "Usa cierres verificables; no ejecuta operaciones." : "Uses verifiable closes; never executes trades."}</p></div>
        </div>

        {message ? <p role={message.type === "error" ? "alert" : "status"} className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${message.type === "success" ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100" : "border-rose-300/30 bg-rose-300/10 text-rose-100"}`}>{message.type === "success" ? <CheckCircle2 aria-hidden="true" size={17} /> : null}{message.text}</p> : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] px-4 text-sm">{message?.type === "success" ? (uiLanguage === "es" ? "Listo" : "Done") : (uiLanguage === "es" ? "Cancelar" : "Cancel")}</button>{message?.type !== "success" ? <button type="button" disabled={!valid || busy} onClick={() => void save()} className="min-h-11 rounded-lg border border-cyan-300/35 bg-cyan-300/10 px-5 text-sm font-semibold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40">{busy ? (uiLanguage === "es" ? "Guardando…" : "Saving…") : editing ? (uiLanguage === "es" ? "Guardar cambios" : "Save changes") : (uiLanguage === "es" ? "Crear alerta" : "Create alert")}</button> : null}</div>
      </div> : null}
    </AccessibleDialog>
  );
}
