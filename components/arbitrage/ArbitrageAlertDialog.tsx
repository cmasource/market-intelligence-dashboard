"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BellRing, CheckCircle2, Info, Mail, ShieldAlert } from "lucide-react";
import { AccessibleDialog } from "@/components/ui/AccessibleDialog";
import { saveArbitrageAlertSubscription } from "@/lib/alerts/client";
import type { ArbitrageOpportunity, FxProvider, TransferAsset } from "@/lib/arbitrage/types";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { createClient } from "@/lib/supabase/client";
import { formatArs } from "./format";

type Props = {
  open: boolean;
  opportunity: ArbitrageOpportunity | null;
  sourceProvider?: FxProvider;
  destinationProvider?: FxProvider;
  asset: TransferAsset;
  onClose: () => void;
};

export function ArbitrageAlertDialog({ open, opportunity, sourceProvider, destinationProvider, asset, onClose }: Props) {
  const { language } = useLanguage();
  const [amount, setAmount] = useState("");
  const [minimumSpread, setMinimumSpread] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    if (!open || !opportunity) return;
    queueMicrotask(() => {
      setAmount(String(opportunity.amountUsd));
      setMinimumSpread(String(Math.max(0.01, Math.round(opportunity.grossSpreadPerUsd * 100) / 100)));
      setMessage(null);
    });
  }, [open, opportunity]);

  if (!opportunity) return null;
  const amountValue = Number(amount.replace(",", "."));
  const spreadValue = Number(minimumSpread.replace(",", "."));
  const valid = Number.isFinite(amountValue) && amountValue >= 1 && Number.isFinite(spreadValue) && spreadValue >= 0.01;
  const sourceName = sourceProvider?.name ?? opportunity.sourceProviderId;
  const destinationName = destinationProvider?.name ?? opportunity.destinationProviderId;
  const hasUnverifiedTime = opportunity.blockers.includes("stale_quote") || opportunity.warnings.includes("observed_at_unavailable");

  async function save() {
    if (!valid || !opportunity) return;
    setBusy(true);
    setMessage(null);
    try {
      const { data } = await createClient().auth.getUser();
      if (!data.user) throw new Error(language === "es" ? "Iniciá sesión para guardar esta alerta." : "Sign in to save this alert.");
      await saveArbitrageAlertSubscription({
        userId: data.user.id,
        sourceProviderId: opportunity.sourceProviderId,
        destinationProviderId: opportunity.destinationProviderId,
        transferAsset: asset,
        amountUsd: amountValue,
        minimumGrossSpreadArs: spreadValue,
      });
      setMessage({
        type: "success",
        text: language === "es"
          ? `Alerta configurada para ${sourceName} → ${destinationName}.`
          : `Alert configured for ${sourceName} → ${destinationName}.`,
      });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : (language === "es" ? "No se pudo guardar la alerta." : "The alert could not be saved.") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AccessibleDialog
      open={open}
      onClose={onClose}
      title={language === "es" ? "Crear alerta de arbitraje" : "Create arbitrage alert"}
      description={language === "es" ? "Monitoreá una diferencia bruta entre dos proveedores. El sistema no ejecuta operaciones." : "Monitor a gross price difference between two providers. The system never executes transactions."}
    >
      <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200">{asset === "USD_BANK" ? (language === "es" ? "USD bancario" : "Bank USD") : asset}</p>
        <p className="mt-2 flex items-center gap-2 text-sm font-semibold"><span>{sourceName}</span><span aria-hidden="true">→</span><span>{destinationName}</span></p>
        <p className="mt-2 text-xs text-[var(--cma-text-secondary)]">{language === "es" ? "Diferencia actual" : "Current difference"}: {formatArs(opportunity.grossSpreadPerUsd, language, true)} {language === "es" ? "por unidad" : "per unit"}.</p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          {language === "es" ? "Monto monitoreado (USD)" : "Monitored amount (USD)"}
          <input type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} className="min-h-12 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] px-3 outline-none focus:border-cyan-300" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          {language === "es" ? "Avisarme desde (ARS por USD)" : "Notify me from (ARS per USD)"}
          <input type="number" min="0.01" step="0.01" value={minimumSpread} onChange={(event) => setMinimumSpread(event.target.value)} className="min-h-12 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] px-3 outline-none focus:border-cyan-300" />
        </label>
      </div>
      <p className="mt-2 text-xs leading-5 text-[var(--cma-text-muted)]">{language === "es" ? "Ejemplo: 1,50 significa que se activa cuando la venta supera la compra por al menos ARS 1,50 por cada USD." : "Example: 1.50 triggers when the sell quote exceeds the buy quote by at least ARS 1.50 per USD."}</p>

      <div className="mt-4 space-y-2 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-xs leading-5 text-[var(--cma-text-secondary)]">
        <p className="flex gap-2"><ShieldAlert aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-amber-200" />{language === "es" ? "La alerta informa una diferencia bruta. Costos, límites, disponibilidad y tiempos pueden eliminarla." : "The alert reports a gross difference. Costs, limits, availability and timing can eliminate it."}</p>
        {hasUnverifiedTime ? <p className="flex gap-2"><Info aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-sky-200" />{language === "es" ? "Alguna fuente no informa hora propia. La alerta mostrará la hora exacta en que CMA consultó esa cotización." : "At least one source does not report its own timestamp. The alert will show the exact time CMA retrieved that quote."}</p> : null}
        <p className="flex gap-2"><Mail aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-cyan-200" />{language === "es" ? "Para recibirla por email, activá Email en Preferencias de alertas." : "To receive it by email, enable Email in Alert preferences."} <Link href="/account/alerts" className="font-semibold text-cyan-200 underline">{language === "es" ? "Abrir preferencias" : "Open preferences"}</Link></p>
      </div>

      {message ? <p role={message.type === "error" ? "alert" : "status"} className={`mt-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${message.type === "success" ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100" : "border-rose-300/30 bg-rose-300/10 text-rose-100"}`}>{message.type === "success" ? <CheckCircle2 aria-hidden="true" size={17} /> : null}{message.text}</p> : null}

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] px-4 text-sm">{message?.type === "success" ? (language === "es" ? "Listo" : "Done") : (language === "es" ? "Cancelar" : "Cancel")}</button>
        {message?.type !== "success" ? <button type="button" disabled={!valid || busy} onClick={() => void save()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-cyan-300/35 bg-cyan-300/10 px-5 text-sm font-semibold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"><BellRing aria-hidden="true" size={16} />{busy ? (language === "es" ? "Guardando…" : "Saving…") : (language === "es" ? "Guardar alerta" : "Save alert")}</button> : null}
      </div>
    </AccessibleDialog>
  );
}
