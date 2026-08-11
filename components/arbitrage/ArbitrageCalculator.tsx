import { AlertTriangle, BellRing, Calculator, CheckCircle2, Info } from "lucide-react";
import { getIssueLabel, type ArbitrageTranslate } from "@/lib/arbitrage/labels";
import type { ArbitrageOpportunity, FxProvider, FxQuote, TransferAsset } from "@/lib/arbitrage/types";
import type { Language } from "@/lib/i18n/types";
import { formatArs, formatUsd } from "./format";

type ArbitrageCalculatorProps = {
  amount: string;
  onAmountChange: (value: string) => void;
  sourceId: string;
  destinationId: string;
  onSourceChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  buyQuotes: FxQuote[];
  sellQuotes: FxQuote[];
  opportunity?: ArbitrageOpportunity;
  providers: Map<string, FxProvider>;
  asset: TransferAsset;
  language: Language;
  t: ArbitrageTranslate;
  onCreateAlert?: (opportunity: ArbitrageOpportunity) => void;
};

function assetLabel(asset: TransferAsset, language: Language) {
  if (asset === "USD_BANK") return language === "es" ? "USD bancario" : "bank USD";
  return asset;
}

export function ArbitrageCalculator(props: ArbitrageCalculatorProps) {
  const { amount, onAmountChange, sourceId, destinationId, onSourceChange, onDestinationChange, buyQuotes, sellQuotes, opportunity, providers, asset, language, t, onCreateAlert } = props;
  const selectedSource = buyQuotes.find((quote) => quote.id === sourceId);
  const destinationOptions = sellQuotes.filter((quote) => quote.providerId !== selectedSource?.providerId);
  const issues = opportunity ? [...new Set([...opportunity.blockers, ...opportunity.warnings])] : [];
  const differenceTone = opportunity && opportunity.grossProfitArs > 0 ? "text-emerald-300" : "text-rose-300";

  return (
    <section className="rounded-xl border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] p-4 sm:p-5" data-testid="arbitrage-calculator">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] text-[var(--cma-accent-cyan)]"><Calculator size={17} aria-hidden="true" /></span>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--cma-text-muted)]">{language === "es" ? `Calculadora ${assetLabel(asset, language)}` : `${assetLabel(asset, language)} calculator`}</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--cma-text-muted)]">{language === "es" ? "La selección queda limitada al mismo activo y no ejecuta operaciones." : "Selection is limited to the same asset and never executes transactions."}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <label className="block text-xs font-semibold text-[var(--cma-text-secondary)]">
          {t("arbitrageAmount")}
          <input aria-describedby="arbitrage-amount-help" type="number" min="0.01" step="0.01" inputMode="decimal" value={amount} onChange={(event) => onAmountChange(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 text-sm text-[var(--cma-text-primary)] outline-none focus:border-[var(--cma-accent-cyan)] focus:ring-2 focus:ring-[var(--cma-accent-cyan)]/20" />
          <span id="arbitrage-amount-help" className="mt-1 block text-[10px] font-normal text-[var(--cma-text-muted)]">{t("arbitrageAmountHelp")}</span>
        </label>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <label className="text-xs font-semibold text-[var(--cma-text-secondary)]">
            {t("arbitrageSourceProvider")}
            <select aria-label={t("arbitrageSourceProvider")} value={sourceId} onChange={(event) => onSourceChange(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 text-xs text-[var(--cma-text-primary)] outline-none focus:border-[var(--cma-accent-cyan)]">
              {buyQuotes.map((quote) => <option key={quote.id} value={quote.id}>{providers.get(quote.providerId)?.name ?? quote.providerId} · {formatArs(quote.userBuysUsdAt ?? 0, language)}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-[var(--cma-text-secondary)]">
            {t("arbitrageDestinationProvider")}
            <select aria-label={t("arbitrageDestinationProvider")} value={destinationId} onChange={(event) => onDestinationChange(event.target.value)} disabled={!destinationOptions.length} className="mt-1.5 h-11 w-full rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 text-xs text-[var(--cma-text-primary)] outline-none focus:border-[var(--cma-accent-cyan)] disabled:cursor-not-allowed disabled:opacity-50">
              {destinationOptions.map((quote) => <option key={quote.id} value={quote.id}>{providers.get(quote.providerId)?.name ?? quote.providerId} · {formatArs(quote.userSellsUsdAt ?? 0, language)}</option>)}
            </select>
          </label>
        </div>
      </div>

      {!opportunity ? (
        <div className="mt-4 rounded-lg border border-dashed border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] p-4 text-center">
          <Info size={18} aria-hidden="true" className="mx-auto text-[var(--cma-text-muted)]" />
          <p className="mt-2 text-xs font-semibold text-[var(--cma-text-primary)]">{destinationOptions.length ? t("arbitrageInvalidAmount") : (language === "es" ? "No hay otro proveedor comparable para este activo." : "There is no other comparable provider for this asset.")}</p>
        </div>
      ) : (
        <div className="mt-4">
          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] p-3"><dt className="text-[10px] text-[var(--cma-text-muted)]">{t("arbitrageCapitalRequired")}</dt><dd className="cma-metric mt-1 text-sm font-semibold text-[var(--cma-text-primary)]">{formatArs(opportunity.capitalRequiredArs, language)}</dd></div>
            <div className="rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] p-3"><dt className="text-[10px] text-[var(--cma-text-muted)]">{t("arbitrageGrossResult")}</dt><dd className={`cma-metric mt-1 text-sm font-semibold ${differenceTone}`}>{formatArs(opportunity.grossProfitArs, language, true)}</dd></div>
            <div className="rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] p-3"><dt className="text-[10px] text-[var(--cma-text-muted)]">{t("arbitrageGrossSpread")}</dt><dd className={`cma-metric mt-1 text-sm font-semibold ${differenceTone}`}>{formatArs(opportunity.grossSpreadPerUsd, language, true)}</dd></div>
            <div className="rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] p-3"><dt className="text-[10px] text-[var(--cma-text-muted)]">{t("arbitrageAmount")}</dt><dd className="cma-metric mt-1 text-sm font-semibold text-[var(--cma-text-primary)]">{formatUsd(opportunity.amountUsd, language)}</dd></div>
          </dl>

          <div className="mt-3 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] p-3">
            {issues.length ? <ul className="space-y-1.5">{issues.slice(0, 4).map((issue) => <li key={issue} className="flex gap-2 text-[10px] leading-4 text-[var(--cma-text-secondary)]"><AlertTriangle size={12} aria-hidden="true" className="mt-0.5 shrink-0 text-amber-300" />{getIssueLabel(issue, t)}</li>)}</ul> : <p className="flex items-center gap-2 text-xs text-emerald-300"><CheckCircle2 size={14} aria-hidden="true" />{t("arbitrageNoBlockers")}</p>}
          </div>

          <p className="mt-3 text-[10px] leading-4 text-[var(--cma-text-muted)]">{opportunity.costStatus === "unknown" ? (language === "es" ? "Costos no verificados: el resultado es una diferencia bruta, no una ganancia neta." : "Unverified costs: this is a gross difference, not net profit.") : (language === "es" ? "Verificá el precio final y las condiciones en cada proveedor." : "Verify final prices and conditions with each provider.")}</p>
          {opportunity.grossSpreadPerUsd > 0 && onCreateAlert ? <button type="button" onClick={() => onCreateAlert(opportunity)} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-cyan-300/35 bg-cyan-300/10 px-4 text-sm font-semibold text-cyan-100 hover:border-cyan-300/60"><BellRing aria-hidden="true" size={16} />{language === "es" ? "Monitorear esta ruta" : "Monitor this route"}</button> : null}
        </div>
      )}
    </section>
  );
}
