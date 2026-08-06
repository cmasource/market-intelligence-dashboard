"use client";

import { useCallback, useEffect, useState } from "react";
import { AccessibleDialog } from "@/components/ui/AccessibleDialog";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";
import {
  WATCHLIST_IMPORT_DECISION_KEY,
  hasLocalWatchlistData,
  importLocalWatchlistsToAccount,
} from "@/lib/watchlist";

export function WatchlistImportPrompt() {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const inspect = useCallback(async () => {
    if (!getSupabaseConfig()) return;
    const { data } = await createClient().auth.getUser();
    const id = data.user?.id ?? null;
    setUserId(id);
    if (!id) return;
    const saved = window.localStorage.getItem(`${WATCHLIST_IMPORT_DECISION_KEY}:${id}`);
    const deferredThisSession = window.sessionStorage.getItem(`${WATCHLIST_IMPORT_DECISION_KEY}:later:${id}`);
    if (!saved && !deferredThisSession && await hasLocalWatchlistData()) setOpen(true);
  }, []);

  useEffect(() => { queueMicrotask(() => { void inspect(); }); }, [inspect]);

  function saveDecision(decision: "imported" | "device_only") {
    if (userId) window.localStorage.setItem(`${WATCHLIST_IMPORT_DECISION_KEY}:${userId}`, decision);
  }

  async function importNow() {
    if (!userId) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await importLocalWatchlistsToAccount(userId);
      if (!result.errors.length) saveDecision("imported");
      setMessage(language === "es"
        ? `Importación completa: ${result.itemsImported} activos nuevos, ${result.itemsSkipped} duplicados omitidos${result.errors.length ? ` y ${result.errors.length} errores parciales` : ""}. El respaldo local se conservó.`
        : `Import complete: ${result.itemsImported} new assets, ${result.itemsSkipped} duplicates skipped${result.errors.length ? ` and ${result.errors.length} partial errors` : ""}. The local backup was kept.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (language === "es" ? "No se pudo importar." : "Import failed."));
    } finally {
      setBusy(false);
    }
  }

  function keepLocal() {
    saveDecision("device_only");
    setOpen(false);
  }

  function decideLater() {
    if (userId) window.sessionStorage.setItem(`${WATCHLIST_IMPORT_DECISION_KEY}:later:${userId}`, "1");
    setOpen(false);
  }

  return (
    <AccessibleDialog
      open={open}
      onClose={decideLater}
      title={language === "es" ? "Encontramos listas guardadas en este dispositivo" : "We found watchlists saved on this device"}
      description={language === "es"
        ? "Podés importarlas a tu cuenta sin borrar el respaldo local. La operación evita duplicados y se puede repetir de forma segura."
        : "You can import them into your account without deleting the local backup. Duplicates are skipped and the operation is safe to repeat."}
    >
      {message ? <p role="status" aria-live="polite" className="rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] p-3 text-sm text-[var(--cma-text-secondary)]">{message}</p> : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <button type="button" disabled={busy} onClick={() => void importNow()} className="min-h-11 rounded-lg border border-cyan-300/35 bg-cyan-300/10 px-3 text-sm font-semibold text-cyan-100 disabled:opacity-50">
          {busy ? (language === "es" ? "Importando…" : "Importing…") : (language === "es" ? "Importar" : "Import")}
        </button>
        <button type="button" disabled={busy} onClick={keepLocal} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] px-3 text-sm text-[var(--cma-text-secondary)]">
          {language === "es" ? "Sólo este dispositivo" : "This device only"}
        </button>
        <button type="button" disabled={busy} onClick={decideLater} className="min-h-11 rounded-lg px-3 text-sm text-[var(--cma-text-muted)]">
          {language === "es" ? "Decidir más tarde" : "Decide later"}
        </button>
      </div>
      {message?.includes(language === "es" ? "completa" : "complete") ? (
        <button type="button" onClick={() => setOpen(false)} className="mt-4 min-h-11 w-full rounded-lg border border-[var(--cma-border-soft)] text-sm font-medium text-[var(--cma-text-primary)]">
          {language === "es" ? "Cerrar" : "Close"}
        </button>
      ) : null}
    </AccessibleDialog>
  );
}
