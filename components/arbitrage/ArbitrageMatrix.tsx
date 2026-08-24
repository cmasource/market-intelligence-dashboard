import { AlertTriangle, ArrowRight, Ban, CheckCircle2, CircleHelp, Clock3 } from "lucide-react";
import type { ArbitrageTranslate } from "@/lib/arbitrage/labels";
import type { ArbitrageOpportunity, FxProvider, FxQuote, TransferAsset } from "@/lib/arbitrage/types";
import type { Language } from "@/lib/i18n/types";
import { formatArs } from "./format";
import { ProviderLogo } from "./ProviderLogo";

type ArbitrageMatrixProps = {
  buyQuotes: FxQuote[];
  sellQuotes: FxQuote[];
  opportunities: ArbitrageOpportunity[];
  providers: Map<string, FxProvider>;
  language: Language;
  asset: TransferAsset;
  t: ArbitrageTranslate;
};

function routeStatus(opportunity: ArbitrageOpportunity, language: Language) {
  if (opportunity.freshnessStatus === "stale") return { icon: Clock3, label: language === "es" ? "Cotización desactualizada" : "Stale quote", tone: "text-amber-300" };
  if (opportunity.blockers.includes("transfer_capability_unverified")) return { icon: CircleHelp, label: language === "es" ? "Transferencia no verificada" : "Transfer not verified", tone: "text-sky-300" };
  if (!opportunity.isCompatible) return { icon: Ban, label: language === "es" ? "Ruta no operable" : "Route not operable", tone: "text-[var(--cma-text-muted)]" };
  if (opportunity.classification === "verified_opportunity") return { icon: CheckCircle2, label: language === "es" ? "Oportunidad verificada" : "Verified opportunity", tone: "text-emerald-300" };
  if (opportunity.classification === "potential_gross_difference") return { icon: AlertTriangle, label: language === "es" ? "Posible diferencia bruta" : "Possible gross difference", tone: "text-amber-300" };
  return { icon: AlertTriangle, label: language === "es" ? "Sin diferencia positiva" : "No positive difference", tone: "text-rose-300" };
}

export function ArbitrageMatrix({ opportunities, providers, language, asset }: ArbitrageMatrixProps) {
  const comparable = opportunities
    .filter((item) => !item.blockers.includes("same_provider") && !item.blockers.includes("asset_mismatch") && item.buyRate > 0 && item.sellRate > 0)
    .toSorted((left, right) => right.grossSpreadPerUsd - left.grossSpreadPerUsd)
    .slice(0, 4);

  return (
    <section className="rounded-xl border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] p-4 sm:p-5" data-testid="arbitrage-matrix">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--cma-text-muted)]">{language === "es" ? "Análisis de rutas" : "Route analysis"}</h2>
          <p className="mt-1 text-xs text-[var(--cma-text-muted)]">{language === "es" ? `Sólo compara ${asset === "USD_BANK" ? "USD bancario" : asset}.` : `Only compares ${asset === "USD_BANK" ? "bank USD" : asset}.`}</p>
        </div>
        <span className="rounded-full border border-[var(--cma-border-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--cma-text-muted)]">{comparable.length}</span>
      </div>

      {comparable.length ? (
        <div className="mt-4 space-y-3">
          {comparable.map((opportunity) => {
            const source = providers.get(opportunity.sourceProviderId);
            const destination = providers.get(opportunity.destinationProviderId);
            const status = routeStatus(opportunity, language);
            const Icon = status.icon;
            return (
              <article key={opportunity.id} className="rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] p-3">
                <div className="flex items-center gap-2">
                  <ProviderLogo providerId={opportunity.sourceProviderId} providerName={source?.name ?? opportunity.sourceProviderId} size="sm" />
                  <ArrowRight size={14} aria-hidden="true" className="shrink-0 text-[var(--cma-text-muted)]" />
                  <ProviderLogo providerId={opportunity.destinationProviderId} providerName={destination?.name ?? opportunity.destinationProviderId} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[var(--cma-text-primary)]">{source?.name ?? opportunity.sourceProviderId} → {destination?.name ?? opportunity.destinationProviderId}</p>
                    <p className={`mt-1 flex items-center gap-1 text-[10px] font-semibold ${status.tone}`}><Icon size={11} aria-hidden="true" />{status.label}</p>
                  </div>
                  <div className="text-right">
                    <p className={`cma-metric text-sm font-semibold ${opportunity.grossSpreadPerUsd > 0 ? "text-emerald-300" : "text-rose-300"}`}>{formatArs(opportunity.grossSpreadPerUsd, language, true)}</p>
                    <p className="mt-1 text-[10px] text-[var(--cma-text-muted)]">{language === "es" ? "por unidad" : "per unit"}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] p-6 text-center">
          <Ban size={22} aria-hidden="true" className="mx-auto text-[var(--cma-text-muted)]" />
          <p className="mt-2 text-sm font-semibold text-[var(--cma-text-primary)]">{language === "es" ? "Sin rutas comparables" : "No comparable routes"}</p>
          <p className="mt-1 text-xs text-[var(--cma-text-muted)]">{language === "es" ? "Se necesitan al menos dos proveedores del mismo activo." : "At least two providers for the same asset are required."}</p>
        </div>
      )}
    </section>
  );
}
