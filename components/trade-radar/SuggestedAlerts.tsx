"use client";

import type { TradeRadarAnalysis } from "@/lib/technical/trade-radar";
import { formatTradeRadarAlertCondition } from "@/lib/technical/trade-radar-labels";

type SuggestedAlertsProps = {
  alerts: TradeRadarAnalysis["suggestedAlerts"];
};

export function SuggestedAlerts({ alerts }: SuggestedAlertsProps) {
  return (
    <section className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-4">
      <h3 className="text-sm font-semibold text-amber-100">Alertas sugeridas</h3>
      <div className="mt-3 grid gap-3">
        {alerts.length ? alerts.map((alert) => (
          <div key={`${alert.condition}-${alert.level}`} className="rounded-lg border border-white/10 bg-slate-950/45 p-3">
            <p className="font-mono text-sm text-white">
              {formatTradeRadarAlertCondition(alert.condition)} {alert.level}
            </p>
            <p className="mt-1 text-sm text-slate-300">{alert.reason}</p>
          </div>
        )) : (
          <p className="text-sm text-slate-300">Sin alertas sugeridas por muestra insuficiente o falta de niveles verificables.</p>
        )}
      </div>
    </section>
  );
}
