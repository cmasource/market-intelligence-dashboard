import { ExternalLink } from "lucide-react";
import { getInstrumentLabel, getQuoteStatusLabel, type ArbitrageTranslate } from "@/lib/arbitrage/labels";
import { getFreshnessStatus } from "@/lib/arbitrage/freshness";
import type { FxProvider, FxQuote } from "@/lib/arbitrage/types";
import type { Language } from "@/lib/i18n/types";
import { formatAge, formatArs, formatTimestamp } from "./format";

type QuoteRankingTableProps = {
  mode: "buy" | "sell";
  quotes: FxQuote[];
  providers: Map<string, FxProvider>;
  language: Language;
  t: ArbitrageTranslate;
};

function capabilityLabel(value: boolean | undefined, t: ArbitrageTranslate) {
  if (value === true) return t("arbitrageYes");
  if (value === false) return t("arbitrageNo");
  return t("arbitrageUnknown");
}

function limitsLabel(quote: FxQuote, t: ArbitrageTranslate) {
  const limits = quote.limits;
  if (!limits) return t("arbitrageNoLimitReported");
  const values = [
    limits.minimumUsd !== undefined ? `min USD ${limits.minimumUsd}` : undefined,
    limits.maximumUsd !== undefined ? `max USD ${limits.maximumUsd}` : undefined,
    limits.dailyMaximumUsd !== undefined ? `24h USD ${limits.dailyMaximumUsd}` : undefined,
    limits.monthlyMaximumUsd !== undefined ? `30d USD ${limits.monthlyMaximumUsd}` : undefined,
  ].filter(Boolean);
  return values.length ? values.join(" · ") : t("arbitrageNoLimitReported");
}

export function QuoteRankingTable({ mode, quotes, providers, language, t }: QuoteRankingTableProps) {
  return (
    <section className="cma-panel overflow-hidden" data-testid={`arbitrage-${mode}-ranking`}>
      <div className="border-b border-[var(--cma-border-soft)] px-4 py-4 sm:px-5">
        <h2 className="text-xl font-semibold text-[var(--cma-text-primary)]">
          {mode === "buy" ? t("arbitrageCheapestBuy") : t("arbitrageBestSell")}
        </h2>
      </div>
      <div className="overflow-x-auto" tabIndex={0} aria-label={mode === "buy" ? t("arbitrageCheapestBuy") : t("arbitrageBestSell")}>
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="bg-[var(--cma-bg-elevated)] text-xs uppercase text-[var(--cma-text-muted)]">
            <tr>
              <th scope="col" className="px-4 py-3">{t("arbitrageProvider")}</th>
              <th scope="col" className="px-4 py-3">{t("arbitrageInstrument")}</th>
              <th scope="col" className="px-4 py-3">{mode === "buy" ? t("arbitrageBuyAt") : t("arbitrageSellAt")}</th>
              <th scope="col" className="px-4 py-3">{t("arbitrageTransferAsset")}</th>
              <th scope="col" className="px-4 py-3">{mode === "buy" ? t("arbitrageWithdrawal") : t("arbitrageDeposit")}</th>
              <th scope="col" className="px-4 py-3">{t("arbitrageLimits")}</th>
              <th scope="col" className="px-4 py-3">{t("arbitrageAvailability")}</th>
              <th scope="col" className="px-4 py-3">{t("arbitrageStatus")}</th>
              <th scope="col" className="px-4 py-3">{t("arbitrageLastUpdate")}</th>
              <th scope="col" className="px-4 py-3">{t("arbitrageSource")}</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote) => {
              const provider = providers.get(quote.providerId);
              const rate = mode === "buy" ? quote.userBuysUsdAt : quote.userSellsUsdAt;
              const capability = quote.transferAsset === "USD_BANK"
                ? (mode === "buy" ? provider?.supportsUsdWithdrawal : provider?.supportsUsdDeposit)
                : quote.transferAsset === "USDT"
                  ? (mode === "buy" ? provider?.supportsUsdtWithdrawal : provider?.supportsUsdtDeposit)
                  : (mode === "buy" ? provider?.supportsUsdcWithdrawal : provider?.supportsUsdcDeposit);
              const freshness = getFreshnessStatus(quote);
              return (
                <tr key={quote.id} className="border-t border-[var(--cma-border-soft)]">
                  <td className="px-4 py-3 font-semibold text-[var(--cma-text-primary)]">{provider?.name ?? quote.providerId}</td>
                  <td className="px-4 py-3 text-[var(--cma-text-secondary)]">{getInstrumentLabel(quote.instrument, t)}</td>
                  <td className="px-4 py-3 font-semibold text-[var(--cma-text-primary)]">{rate ? formatArs(rate, language) : "-"}</td>
                  <td className="px-4 py-3 text-[var(--cma-text-secondary)]">{quote.transferAsset}</td>
                  <td className="px-4 py-3 text-[var(--cma-text-secondary)]">{capabilityLabel(capability, t)}</td>
                  <td className="px-4 py-3 text-xs text-[var(--cma-text-secondary)]">{limitsLabel(quote, t)}</td>
                  <td className="px-4 py-3 text-[var(--cma-text-secondary)]">{provider?.operates24x7 ? t("arbitrage24x7") : t("arbitrageBusinessHours")}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${freshness === "fresh" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : freshness === "stale" ? "border-rose-400/30 bg-rose-400/10 text-rose-300" : "border-amber-400/30 bg-amber-400/10 text-amber-300"}`}>
                      {getQuoteStatusLabel(quote.status, t)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--cma-text-muted)]">
                    <span className="block">{t("arbitrageObservedAt")}: {formatTimestamp(quote.observedAt, language)}</span>
                    <span className="mt-1 block">{t("arbitrageFetchedAt")}: {formatTimestamp(quote.fetchedAt, language)}</span>
                    <span className="mt-1 block">{t("arbitrageAge")}: {formatAge(quote.observedAt, language)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {quote.sourceUrl ? <a href={quote.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1.5 font-semibold text-[var(--cma-accent-cyan)] hover:underline"><ExternalLink size={14} aria-hidden="true" />{t("arbitrageOpenSource")}</a> : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {quotes.length === 0 ? <p className="p-5 text-sm text-[var(--cma-text-muted)]">{t("arbitrageNoQuotes")}</p> : null}
    </section>
  );
}
