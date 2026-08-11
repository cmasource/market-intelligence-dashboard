"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BellRing, CheckCircle2, Mail, ShieldAlert } from "lucide-react";
import { AccessibleDialog } from "@/components/ui/AccessibleDialog";
import { saveArbitrageAlertSubscription } from "@/lib/alerts/client";
import type { ArbitrageOpportunity, FxProvider, TransferAsset } from "@/lib/arbitrage/types";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { createClient } from "@/lib/supabase/client";
import { formatArs } from "./format";

type Props = {
  open: boolean;
  scope: "route" | "any_verified";
  opportunity: ArbitrageOpportunity | null;
  sourceProvider?: FxProvider;
  destinationProvider?: FxProvider;
  asset: TransferAsset;
  onClose: () => void;
};

export function ArbitrageAlertDialog({ open, scope, opportunity, sourceProvider, destinationProvider, asset, onClose }: Props) {
  const { language } = useLanguage();
  const [minimumSpread, setMinimumSpread] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    if (!open || !opportunity) return;
    queueMicrotask(() => {
      setMinimumSpread("5");
      setMessage(null);
    });
  }, [open, opportunity]);

  if (!opportunity) return null;
  const spreadValue = Number(minimumSpread.replace(",", "."));
  const valid = Number.isFinite(spreadValue) && spreadValue >= 0.01;
  const sourceName = sourceProvider?.name ?? opportunity.sourceProviderId;
  const destinationName = destinationProvider?.name ?? opportunity.destinationProviderId;

  async function save() {
    if (!valid || !opportunity) return;
    setBusy(true);
    setMessage(null);
    try {
      const { data } = await createClient().auth.getUser();
      if (!data.user) throw new Error(language === "es" ? "Iniciá sesión para guardar esta alerta." : "Sign in to save this alert.");
      await saveArbitrageAlertSubscription({
        userId: data.user.id,
        scope,
        sourceProviderId: scope === "route" ? opportunity.sourceProviderId : null,
        destinationProviderId: scope === "route" ? opportunity.destinationProviderId : null,
        transferAsset: asset,
        minimumGrossSpreadArs: spreadValue,
      });
      setMessage({
        type: "success",
        text: language === "es"
          ? scope === "any_verified" ? `El Radar avisará cuando encuentre una diferencia de al menos ARS ${spreadValue.toLocaleString("es-AR")} por USD en ${asset === "USD_BANK" ? "USD bancario" : asset}.` : `Alerta configurada para ${sourceName} → ${destinationName} desde ARS ${spreadValue.toLocaleString("es-AR")} por USD.`
          : scope === "any_verified" ? `The Radar will alert when it finds a difference of at least ARS ${spreadValue.toLocaleString("en-US")} per USD in ${asset === "USD_BANK" ? "bank USD" : asset}.` : `Alert configured for ${sourceName} → ${destinationName} from ARS ${spreadValue.toLocaleString("en-US")} per USD.`,
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
      title={language === "es" ? "Alertarme por diferencia de cotización" : "Alert me about a quote difference"}
      description={language === "es" ? (scope === "any_verified" ? "El Radar revisará todas las cotizaciones comparables y avisará cuando la diferencia por USD alcance tu umbral." : "El Radar seguirá esta comparación y avisará cuando la diferencia por USD alcance tu umbral.") : (scope === "any_verified" ? "The Radar will check all comparable quotes and alert when the per-USD difference reaches your threshold." : "The Radar will track this comparison and alert when the per-USD difference reaches your threshold.")}
    >
      <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200">{asset === "USD_BANK" ? (language === "es" ? "USD bancario" : "Bank USD") : asset}</p>
        <p className="mt-2 flex items-center gap-2 text-sm font-semibold">{scope === "any_verified" ? (language === "es" ? "Todas las rutas comparables" : "All comparable routes") : <><span>{sourceName}</span><span aria-hidden="true">→</span><span>{destinationName}</span></>}</p>
        <p className="mt-2 text-xs text-[var(--cma-text-secondary)]">{scope === "any_verified" ? (language === "es" ? "La ruta visible es sólo una referencia; el monitor elegirá automáticamente la mayor diferencia comparable." : "The visible route is only a reference; the monitor will automatically select the largest comparable difference.") : <>{language === "es" ? "Diferencia actual" : "Current difference"}: {formatArs(opportunity.grossSpreadPerUsd, language, true)} {language === "es" ? "por unidad" : "per unit"}.</>}</p>
      </div>

      <div className="mt-4">
        <label className="grid gap-2 text-sm font-medium">
          {language === "es" ? "Diferencia mínima para avisarme (ARS por USD)" : "Minimum difference to alert me (ARS per USD)"}
          <input type="number" min="0.01" step="0.01" value={minimumSpread} onChange={(event) => setMinimumSpread(event.target.value)} className="min-h-12 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] px-3 outline-none focus:border-cyan-300" />
        </label>
      </div>
      <p className="mt-2 text-xs leading-5 text-[var(--cma-text-muted)]">{language === "es" ? "Ejemplo: 5 significa que se activa cuando una cotización de venta supera una cotización de compra por al menos ARS 5 por cada USD. No depende del monto que después decidas operar." : "Example: 5 triggers when a sell quote exceeds a buy quote by at least ARS 5 per USD. It does not depend on the amount you later choose to trade."}</p>

      <div className="mt-4 space-y-2 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-xs leading-5 text-[var(--cma-text-secondary)]">
        <p className="flex gap-2"><ShieldAlert aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-amber-200" />{language === "es" ? "La alerta informa una diferencia bruta entre cotizaciones recientes. No confirma ganancia neta: usá la calculadora para estimar el resultado según tu monto, costos y límites." : "The alert reports a gross difference between recent quotes. It does not confirm net profit: use the calculator to estimate the result for your amount, costs, and limits."}</p>
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
