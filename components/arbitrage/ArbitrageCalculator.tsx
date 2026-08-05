import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { getCostLabel, getIssueLabel, getInstrumentLabel, type ArbitrageTranslate } from "@/lib/arbitrage/labels";
import type { ArbitrageOpportunity, FxProvider, FxQuote } from "@/lib/arbitrage/types";
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
  language: Language;
  t: ArbitrageTranslate;
};

export function ArbitrageCalculator(props: ArbitrageCalculatorProps) {
  const { amount, onAmountChange, sourceId, destinationId, onSourceChange, onDestinationChange, buyQuotes, sellQuotes, opportunity, providers, language, t } = props;
  const issues = opportunity ? [...new Set([...opportunity.blockers, ...opportunity.warnings])] : [];
  return (
    <section className="cma-panel p-4 sm:p-5" data-testid="arbitrage-calculator">
      <h2 className="text-xl font-semibold text-[var(--cma-text-primary)]">{t("arbitrageCalculator")}</h2>
      <p className="mt-1 max-w-4xl text-sm leading-6 text-[var(--cma-text-muted)]">{t("arbitrageCalculatorDescription")}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label className="text-sm font-semibold text-[var(--cma-text-secondary)]">
          {t("arbitrageAmount")}
          <input aria-describedby="arbitrage-amount-help" type="number" min="0.01" step="0.01" inputMode="decimal" value={amount} onChange={(event) => onAmountChange(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 text-[var(--cma-text-primary)] outline-none focus:border-[var(--cma-accent-cyan)] focus:ring-2 focus:ring-[var(--cma-accent-cyan)]/20" />
          <span id="arbitrage-amount-help" className="mt-1 block text-xs font-normal text-[var(--cma-text-muted)]">{t("arbitrageAmountHelp")}</span>
        </label>
        <label className="text-sm font-semibold text-[var(--cma-text-secondary)]">
          {t("arbitrageSourceProvider")}
          <select value={sourceId} onChange={(event) => onSourceChange(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 text-[var(--cma-text-primary)] outline-none focus:border-[var(--cma-accent-cyan)]">
            {buyQuotes.map((quote) => <option key={quote.id} value={quote.id}>{providers.get(quote.providerId)?.name ?? quote.providerId} · {getInstrumentLabel(quote.instrument, t)} · {quote.transferAsset}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-[var(--cma-text-secondary)]">
          {t("arbitrageDestinationProvider")}
          <select value={destinationId} onChange={(event) => onDestinationChange(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 text-[var(--cma-text-primary)] outline-none focus:border-[var(--cma-accent-cyan)]">
            {sellQuotes.map((quote) => <option key={quote.id} value={quote.id}>{providers.get(quote.providerId)?.name ?? quote.providerId} · {getInstrumentLabel(quote.instrument, t)} · {quote.transferAsset}</option>)}
          </select>
        </label>
      </div>

      {!opportunity ? <p className="mt-5 rounded-lg border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-200">{t("arbitrageInvalidAmount")}</p> : (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[
              [t("arbitrageCapitalRequired"), formatArs(opportunity.capitalRequiredArs, language)],
              [t("arbitrageBuyAt"), formatArs(opportunity.buyRate, language)],
              [t("arbitrageSellAt"), formatArs(opportunity.sellRate, language)],
              [t("arbitrageGrossSpread"), formatArs(opportunity.grossSpreadPerUsd, language, true)],
              [t("arbitrageGrossResult"), formatArs(opportunity.grossProfitArs, language, true)],
              [t("arbitrageKnownCosts"), opportunity.costStatus === "unknown" ? t("arbitrageUnverifiedCosts") : formatArs(opportunity.estimatedCostsArs, language)],
              [t("arbitrageNetProfit"), opportunity.netProfitArs === undefined ? t("arbitrageUnverifiedCosts") : formatArs(opportunity.netProfitArs, language, true)],
              [t("arbitrageNetReturn"), opportunity.netReturnPercentage === undefined ? "-" : `${opportunity.netReturnPercentage.toFixed(3)}%`],
              [t("arbitrageAmount"), formatUsd(opportunity.amountUsd, language)],
            ].map(([label, value]) => <div key={label} className="rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] p-3"><dt className="text-xs text-[var(--cma-text-muted)]">{label}</dt><dd className="mt-1 text-sm font-semibold text-[var(--cma-text-primary)]">{value}</dd></div>)}
          </dl>
          <div className="rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] p-4">
            <p className="text-sm font-semibold text-[var(--cma-text-primary)]">{t("arbitrageRequirements")}</p>
            <p className="mt-1 text-xs text-[var(--cma-text-muted)]">{getCostLabel(opportunity.costStatus, t)}</p>
            {issues.length ? <ul className="mt-3 space-y-2">{issues.map((issue) => <li key={issue} className="flex gap-2 text-xs leading-5 text-[var(--cma-text-secondary)]"><AlertTriangle size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-amber-300" />{getIssueLabel(issue, t)}</li>)}</ul> : <p className="mt-3 flex gap-2 text-sm text-emerald-300"><CheckCircle2 size={16} aria-hidden="true" />{t("arbitrageNoBlockers")}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
