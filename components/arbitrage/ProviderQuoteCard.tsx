import { Clock3, ExternalLink, Info, ShieldCheck, Trophy } from "lucide-react";
import { getFreshnessStatus } from "@/lib/arbitrage/freshness";
import { getInstrumentLabel, getQuoteStatusLabel, getVerificationLabel, type ArbitrageTranslate } from "@/lib/arbitrage/labels";
import type { FxProvider, FxQuote, TransferAsset } from "@/lib/arbitrage/types";
import type { Language } from "@/lib/i18n/types";
import { formatAge, formatArs, formatTimestamp, formatUsd } from "./format";
import { ProviderLogo } from "./ProviderLogo";

type ProviderQuoteCardProps = {
  quote: FxQuote;
  provider?: FxProvider;
  asset: TransferAsset;
  isBestBuy: boolean;
  isBestSell: boolean;
  language: Language;
  t: ArbitrageTranslate;
};

const assetLabels: Record<TransferAsset, string> = {
  USD_BANK: "USD bancario",
  USDT: "USDT",
  USDC: "USDC",
};

function freshnessClasses(status: ReturnType<typeof getFreshnessStatus>) {
  if (status === "fresh") return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
  if (status === "stale") return "border-rose-400/25 bg-rose-400/10 text-rose-300";
  if (status === "unverifiable") return "border-amber-400/25 bg-amber-400/10 text-amber-300";
  return "border-sky-400/25 bg-sky-400/10 text-sky-300";
}

export function ProviderQuoteCard({ quote, provider, asset, isBestBuy, isBestSell, language, t }: ProviderQuoteCardProps) {
  const freshness = getFreshnessStatus(quote);
  const providerName = provider?.name ?? quote.providerId;
  const referenceOnly = quote.verification.quote === "reference_only";
  const observedLabel = quote.observedAt ? formatAge(quote.observedAt, language) : undefined;
  const fetchedLabel = formatAge(quote.fetchedAt, language);
  const freshnessLabel = freshness === "unverifiable"
    ? (language === "es" ? "Fuente sin hora propia" : "Source time unavailable")
    : getQuoteStatusLabel(quote.status, t);
  const isCompositeFiwindRoute = quote.providerId === "fiwind" && quote.instrument === "crypto_usd_route";

  return (
    <article className="group rounded-xl border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] p-4 transition hover:border-[var(--cma-border-strong)]" data-testid={`arbitrage-provider-${quote.providerId}-${asset.toLowerCase()}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <ProviderLogo providerId={quote.providerId} providerName={providerName} />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-[var(--cma-text-primary)]">{providerName}</h3>
            <p className="mt-0.5 text-xs text-[var(--cma-text-muted)]">{getInstrumentLabel(quote.instrument, t)} · {assetLabels[asset]}</p>
          </div>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${freshnessClasses(freshness)}`}>
          <Clock3 size={11} aria-hidden="true" />
          {freshnessLabel}
        </span>
      </div>

      {isCompositeFiwindRoute ? (
        <div className="mt-3 rounded-lg border border-violet-400/20 bg-violet-400/10 px-3 py-2 text-[11px] leading-relaxed text-[var(--cma-text-secondary)]">
          <span className="font-semibold text-violet-300">USD → USDT → ARS.</span>{" "}
          {language === "es"
            ? "Fiwind documenta este circuito automático. La cotización proviene de un agregador y el monto final, los costos y los límites deben verificarse en la app."
            : "Fiwind documents this automatic circuit. The quote comes from an aggregator; final amount, costs, and limits must be checked in the app."}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className={`rounded-lg border p-3 ${isBestBuy ? "border-emerald-400/30 bg-emerald-400/10" : "border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)]"}`}>
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cma-text-muted)]">
            {isBestBuy ? <Trophy size={11} aria-hidden="true" className="text-emerald-300" /> : null}
            {language === "es" ? `Comprás ${asset === "USD_BANK" ? "USD" : asset} a` : `You buy ${asset === "USD_BANK" ? "USD" : asset} at`}
          </p>
          <p className="cma-metric mt-2 text-lg font-semibold text-[var(--cma-text-primary)] sm:text-xl">{quote.userBuysUsdAt ? formatArs(quote.userBuysUsdAt, language) : "-"}</p>
          {isBestBuy ? <p className="mt-1 text-[10px] font-medium text-emerald-300">{referenceOnly ? (language === "es" ? "Referencia más barata" : "Lowest reference") : (language === "es" ? "Compra más barata" : "Cheapest buy")}</p> : null}
        </div>
        <div className={`rounded-lg border p-3 ${isBestSell ? "border-sky-400/30 bg-sky-400/10" : "border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)]"}`}>
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cma-text-muted)]">
            {isBestSell ? <Trophy size={11} aria-hidden="true" className="text-sky-300" /> : null}
            {language === "es" ? `Vendés ${asset === "USD_BANK" ? "USD" : asset} a` : `You sell ${asset === "USD_BANK" ? "USD" : asset} at`}
          </p>
          <p className="cma-metric mt-2 text-lg font-semibold text-[var(--cma-text-primary)] sm:text-xl">{quote.userSellsUsdAt ? formatArs(quote.userSellsUsdAt, language) : "-"}</p>
          {isBestSell ? <p className="mt-1 text-[10px] font-medium text-sky-300">{referenceOnly ? (language === "es" ? "Referencia de venta más alta" : "Highest sell reference") : (language === "es" ? "Venta más alta" : "Highest sell")}</p> : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] text-[var(--cma-text-muted)]">
        <span className="inline-flex items-center gap-1"><Info size={11} aria-hidden="true" />{getVerificationLabel(quote.verification.quote, t)}</span>
        {quote.observedAt
          ? <span title={formatTimestamp(quote.observedAt, language)}>{language === "es" ? "Hora de la fuente" : "Source time"}: {observedLabel}</span>
          : <span>{language === "es" ? "La fuente no informa hora propia" : "The source does not report its own time"}</span>}
        <span title={formatTimestamp(quote.fetchedAt, language)} className="font-medium text-[var(--cma-text-secondary)]">{language === "es" ? "Consultada por CMA" : "Retrieved by CMA"}: {fetchedLabel}</span>
        {!quote.observedAt && quote.sourcePollingIntervalSeconds ? <span>{language === "es" ? `Actualización estimada de la fuente: cada ${Math.round(quote.sourcePollingIntervalSeconds / 60)} min` : `Estimated source update: every ${Math.round(quote.sourcePollingIntervalSeconds / 60)} min`}</span> : null}
        {quote.quotedAmountUsd ? <span>{language === "es" ? "Volumen" : "Volume"}: {formatUsd(quote.quotedAmountUsd, language)}</span> : null}
        {referenceOnly ? <span className="inline-flex items-center gap-1 text-sky-300"><ShieldCheck size={11} aria-hidden="true" />{language === "es" ? "No confirma una ruta operable" : "Does not confirm an operable route"}</span> : null}
        {quote.sourceUrl ? <a href={quote.sourceUrl} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex min-h-8 items-center gap-1 font-semibold text-[var(--cma-accent-cyan)] hover:underline"><ExternalLink size={11} aria-hidden="true" />{t("arbitrageOpenSource")}</a> : null}
      </div>
    </article>
  );
}
