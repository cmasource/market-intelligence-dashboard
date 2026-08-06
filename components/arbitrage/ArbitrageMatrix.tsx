import { AlertTriangle, Ban, CheckCircle2, Clock3 } from "lucide-react";
import type { ArbitrageTranslate } from "@/lib/arbitrage/labels";
import type { ArbitrageOpportunity, FxProvider, FxQuote } from "@/lib/arbitrage/types";
import type { Language } from "@/lib/i18n/types";
import { formatArs } from "./format";

type ArbitrageMatrixProps = {
  buyQuotes: FxQuote[];
  sellQuotes: FxQuote[];
  opportunities: ArbitrageOpportunity[];
  providers: Map<string, FxProvider>;
  language: Language;
  t: ArbitrageTranslate;
};

function cellContent(opportunity: ArbitrageOpportunity, language: Language, t: ArbitrageTranslate) {
  if (opportunity.blockers.includes("same_provider")) return { icon: Ban, label: t("arbitrageSameProvider"), tone: "text-[var(--cma-text-muted)]" };
  if (opportunity.freshnessStatus === "stale") return { icon: Clock3, label: t("arbitrageStaleQuote"), tone: "text-amber-300" };
  if (opportunity.freshnessStatus === "unverifiable") return { icon: Clock3, label: t("arbitrageInformationalReference"), detail: t("arbitrageObservedUnknown"), tone: "text-sky-300" };
  if (!opportunity.buyRate || !opportunity.sellRate) return { icon: AlertTriangle, label: t("arbitrageIncompleteData"), tone: "text-amber-300" };
  if (!opportunity.isCompatible) return { icon: Ban, label: t("arbitrageIncompatibleRoute"), tone: "text-[var(--cma-text-muted)]" };
  if (opportunity.classification === "potential_gross_difference") return { icon: AlertTriangle, label: formatArs(opportunity.grossSpreadPerUsd, language, true), detail: t("arbitragePotentialRoute"), tone: "text-amber-300" };
  const value = opportunity.netProfitArs ?? opportunity.grossProfitArs;
  return {
    icon: value > 0 ? CheckCircle2 : AlertTriangle,
    label: formatArs(opportunity.netProfitArs !== undefined ? opportunity.netProfitArs / opportunity.amountUsd : opportunity.grossSpreadPerUsd, language, true),
    detail: opportunity.netProfitArs !== undefined ? t("arbitrageNetProfit") : t("arbitrageGrossSpread"),
    tone: value > 0 ? "text-emerald-300" : "text-rose-300",
  };
}

export function ArbitrageMatrix({ buyQuotes, sellQuotes, opportunities, providers, language, t }: ArbitrageMatrixProps) {
  const byPair = new Map(opportunities.map((item) => [`${item.sourceQuoteId}--${item.destinationQuoteId}`, item]));
  return (
    <section className="cma-panel overflow-hidden" data-testid="arbitrage-matrix">
      <div className="border-b border-[var(--cma-border-soft)] px-4 py-4 sm:px-5">
        <h2 className="text-xl font-semibold text-[var(--cma-text-primary)]">{t("arbitrageMatrix")}</h2>
        <p className="mt-1 max-w-4xl text-sm leading-6 text-[var(--cma-text-muted)]">{t("arbitrageMatrixDescription")}</p>
      </div>
      <div className="hidden overflow-x-auto md:block" tabIndex={0} aria-label={t("arbitrageMatrix")}>
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-[var(--cma-bg-elevated)] text-xs text-[var(--cma-text-muted)]">
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-[var(--cma-bg-elevated)] px-3 py-3 text-left">{t("arbitrageBuyAt")}</th>
              {sellQuotes.map((quote) => <th key={quote.id} scope="col" className="min-w-40 px-3 py-3 text-left">{providers.get(quote.providerId)?.name ?? quote.providerId}<span className="block font-normal">{quote.transferAsset}</span></th>)}
            </tr>
          </thead>
          <tbody>
            {buyQuotes.map((source) => (
              <tr key={source.id} className="border-t border-[var(--cma-border-soft)]">
                <th scope="row" className="sticky left-0 z-10 bg-[var(--cma-bg-panel)] px-3 py-3 text-left font-semibold text-[var(--cma-text-primary)]">{providers.get(source.providerId)?.name ?? source.providerId}<span className="block text-xs font-normal text-[var(--cma-text-muted)]">{source.transferAsset}</span></th>
                {sellQuotes.map((destination) => {
                  const opportunity = byPair.get(`${source.id}--${destination.id}`);
                  if (!opportunity) return <td key={destination.id} className="px-3 py-3">-</td>;
                  const content = cellContent(opportunity, language, t);
                  const Icon = content.icon;
                  return <td key={destination.id} className={`px-3 py-3 ${content.tone}`}><span className="flex items-center gap-1.5 font-semibold"><Icon size={14} aria-hidden="true" />{content.label}</span>{content.detail ? <span className="mt-1 block text-[10px] font-normal text-[var(--cma-text-muted)]">{content.detail}</span> : null}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 p-4 md:hidden">
        {opportunities.map((opportunity) => {
          const content = cellContent(opportunity, language, t);
          const Icon = content.icon;
          return <article key={opportunity.id} className="rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] p-3"><p className="text-xs text-[var(--cma-text-muted)]">{providers.get(opportunity.sourceProviderId)?.name} → {providers.get(opportunity.destinationProviderId)?.name}</p><p className={`mt-2 flex items-center gap-1.5 text-sm font-semibold ${content.tone}`}><Icon size={15} aria-hidden="true" />{content.label}</p>{content.detail ? <p className="mt-1 text-xs text-[var(--cma-text-muted)]">{content.detail}</p> : null}</article>;
        })}
      </div>
    </section>
  );
}
