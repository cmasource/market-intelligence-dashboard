"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, RefreshCw, ShieldAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { buildOpportunityMatrix, calculateArbitrageOpportunity, findBestOpportunity, getFreshnessStatus, rankBuyQuotes, rankSellQuotes } from "@/lib/arbitrage";
import { getInstrumentLabel, getProviderStatusLabel, getProviderTypeLabel, type ArbitrageTranslate } from "@/lib/arbitrage/labels";
import type { ArbitrageOpportunity, ArbitrageQuotesResponse, FxInstrument, ProviderType } from "@/lib/arbitrage/types";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { ArbitrageCalculator } from "./ArbitrageCalculator";
import { ArbitrageMatrix } from "./ArbitrageMatrix";
import { formatArs, formatTimestamp, formatUsd } from "./format";
import { QuoteRankingTable } from "./QuoteRankingTable";

const providerTypes: ProviderType[] = ["bank", "wallet", "broker", "exchange", "exchange_agency", "aggregator"];
const instruments: FxInstrument[] = ["bank_usd", "official_usd", "usd_24_7", "mep", "usdt", "usdc", "crypto_usd_route"];

function getDefaultQuoteSelection(quotes: ArbitrageQuotesResponse["quotes"]) {
  const best = findBestOpportunity(buildOpportunityMatrix(quotes, 1000));
  return {
    sourceId: best?.sourceQuoteId ?? rankBuyQuotes(quotes)[0]?.id ?? "",
    destinationId: best?.destinationQuoteId ?? rankSellQuotes(quotes)[0]?.id ?? "",
  };
}

export function ArbitrageRadarPage() {
  const { language, t } = useLanguage();
  const translate = t as ArbitrageTranslate;
  const [payload, setPayload] = useState<ArbitrageQuotesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [amount, setAmount] = useState("1000");
  const [sourceId, setSourceId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [providerType, setProviderType] = useState<ProviderType | "all">("all");
  const [instrument, setInstrument] = useState<FxInstrument | "all">("all");
  const [only24x7, setOnly24x7] = useState(false);
  const [onlyCompatible, setOnlyCompatible] = useState(false);
  const [onlyFresh, setOnlyFresh] = useState(false);
  const [onlyPositive, setOnlyPositive] = useState(false);
  const [onlyActive, setOnlyActive] = useState(true);

  const loadQuotes = useCallback(async (forceRefresh: boolean, signal?: AbortSignal) => {
    if (forceRefresh) setRefreshing(true);
    setError(false);
    try {
      const response = await fetch(`/api/arbitrage/quotes${forceRefresh ? "?refresh=1" : ""}`, { signal, cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const next = await response.json() as ArbitrageQuotesResponse;
      setPayload(next);
      const defaults = getDefaultQuoteSelection(next.quotes);
      setSourceId((current) => next.quotes.some((quote) => quote.id === current) ? current : defaults.sourceId);
      setDestinationId((current) => next.quotes.some((quote) => quote.id === current) ? current : defaults.destinationId);
    } catch {
      if (!signal?.aborted) setError(true);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/arbitrage/quotes", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<ArbitrageQuotesResponse>;
      })
      .then((next) => {
        const defaults = getDefaultQuoteSelection(next.quotes);
        setPayload(next);
        setSourceId(defaults.sourceId);
        setDestinationId(defaults.destinationId);
        setError(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const amountUsd = Number.parseFloat(amount.replace(",", "."));
  const validAmount = Number.isFinite(amountUsd) && amountUsd > 0 ? amountUsd : 0;
  const providers = useMemo(() => new Map((payload?.providers ?? []).map((provider) => [provider.id, provider])), [payload]);
  const baseQuotes = useMemo(() => (payload?.quotes ?? []).filter((quote) => {
    const provider = providers.get(quote.providerId);
    if (providerType !== "all" && provider?.providerType !== providerType) return false;
    if (instrument !== "all" && quote.instrument !== instrument) return false;
    if (only24x7 && !provider?.operates24x7) return false;
    if (onlyFresh && getFreshnessStatus(quote) !== "fresh") return false;
    if (onlyActive && provider?.status !== "active") return false;
    return true;
  }), [instrument, only24x7, onlyActive, onlyFresh, payload, providerType, providers]);
  const baseMatrix = useMemo(() => validAmount ? buildOpportunityMatrix(baseQuotes, validAmount) : [], [baseQuotes, validAmount]);
  const visibleQuoteIds = useMemo(() => {
    if (!onlyCompatible && !onlyPositive) return null;
    const matches = baseMatrix.filter((item) => (!onlyCompatible || item.isCompatible) && (!onlyPositive || item.isProfitable));
    return new Set(matches.flatMap((item) => [item.sourceQuoteId, item.destinationQuoteId]));
  }, [baseMatrix, onlyCompatible, onlyPositive]);
  const quotes = useMemo(() => visibleQuoteIds ? baseQuotes.filter((quote) => visibleQuoteIds.has(quote.id)) : baseQuotes, [baseQuotes, visibleQuoteIds]);
  const buyQuotes = useMemo(() => rankBuyQuotes(quotes), [quotes]);
  const sellQuotes = useMemo(() => rankSellQuotes(quotes), [quotes]);
  const matrix = useMemo(() => validAmount ? buildOpportunityMatrix(quotes, validAmount) : [], [quotes, validAmount]);
  const best = useMemo(() => findBestOpportunity(matrix), [matrix]);
  const bestComparable = useMemo(() => matrix.filter((item) => !item.blockers.includes("same_provider") && !item.blockers.includes("asset_mismatch") && item.buyRate > 0 && item.sellRate > 0).toSorted((a, b) => b.grossSpreadPerUsd - a.grossSpreadPerUsd)[0], [matrix]);
  const selectedSource = buyQuotes.find((quote) => quote.id === sourceId) ?? buyQuotes[0];
  const selectedDestination = sellQuotes.find((quote) => quote.id === destinationId) ?? sellQuotes[0];
  const selectedOpportunity = selectedSource && selectedDestination && validAmount ? calculateArbitrageOpportunity(selectedSource, selectedDestination, validAmount) : undefined;

  return (
    <AppShell>
      <div className="space-y-6 py-4 sm:py-6">
        <section className="cma-panel-elevated cma-hero-panel p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="cma-kicker">{t("arbitrageEyebrow")}</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--cma-text-primary)] sm:text-4xl">{t("arbitrageTitle")}</h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--cma-text-secondary)]">{t("arbitrageSubtitle")}</p>
            </div>
            <button type="button" onClick={() => void loadQuotes(true)} disabled={refreshing} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[var(--cma-border-strong)] bg-[var(--cma-bg-elevated)] px-4 text-sm font-semibold text-[var(--cma-text-primary)] transition hover:border-[var(--cma-accent-cyan)] disabled:opacity-60">
              <RefreshCw size={16} aria-hidden="true" className={refreshing ? "animate-spin" : ""} />{refreshing ? t("arbitrageRefreshing") : t("arbitrageRefresh")}
            </button>
          </div>
          <div className="mt-5 flex gap-3 rounded-lg border border-amber-400/25 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100"><ShieldAlert size={19} aria-hidden="true" className="mt-0.5 shrink-0" /><p>{t("arbitrageDisclaimer")}</p></div>
          <p className="mt-3 text-xs text-[var(--cma-text-muted)]" aria-live="polite">{payload ? t("arbitrageUpdatedAt", { time: formatTimestamp(payload.generatedAt, language) }) : loading ? t("arbitrageRefreshing") : ""}</p>
        </section>

        {error ? <div role="alert" className="flex items-center gap-3 rounded-lg border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200"><AlertTriangle size={18} aria-hidden="true" />{t("arbitrageLoadError")}</div> : null}

        <section className="cma-panel p-4 sm:p-5" aria-labelledby="arbitrage-filters-heading">
          <h2 id="arbitrage-filters-heading" className="text-lg font-semibold text-[var(--cma-text-primary)]">{t("arbitrageFilters")}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm text-[var(--cma-text-secondary)]">{t("arbitrageProviderType")}<select value={providerType} onChange={(event) => setProviderType(event.target.value as ProviderType | "all")} className="mt-1 h-10 w-full rounded-md border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 text-[var(--cma-text-primary)]"><option value="all">{t("arbitrageAllProviders")}</option>{providerTypes.map((type) => <option key={type} value={type}>{getProviderTypeLabel(type, translate)}</option>)}</select></label>
            <label className="text-sm text-[var(--cma-text-secondary)]">{t("arbitrageInstrument")}<select value={instrument} onChange={(event) => setInstrument(event.target.value as FxInstrument | "all")} className="mt-1 h-10 w-full rounded-md border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 text-[var(--cma-text-primary)]"><option value="all">{t("arbitrageAllInstruments")}</option>{instruments.map((item) => <option key={item} value={item}>{getInstrumentLabel(item, translate)}</option>)}</select></label>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {[[only24x7, setOnly24x7, "arbitrageOnly24x7"], [onlyCompatible, setOnlyCompatible, "arbitrageOnlyCompatible"], [onlyFresh, setOnlyFresh, "arbitrageOnlyFresh"], [onlyPositive, setOnlyPositive, "arbitrageOnlyPositive"], [onlyActive, setOnlyActive, "arbitrageOnlyActive"]].map(([checked, setter, key]) => <label key={String(key)} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 text-sm text-[var(--cma-text-secondary)]"><input type="checkbox" checked={checked as boolean} onChange={(event) => (setter as (value: boolean) => void)(event.target.checked)} className="h-4 w-4 accent-[var(--cma-accent-cyan)]" />{t(key as string)}</label>)}
          </div>
        </section>

        <section className="cma-panel-elevated p-5" data-testid="best-arbitrage-opportunity">
          {best?.isProfitable ? <BestOpportunity opportunity={best} providers={providers} language={language} t={translate} /> : <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">{t("arbitrageNoNetOpportunity")}</p>{bestComparable ? <p className="mt-3 text-lg font-semibold text-[var(--cma-text-primary)]">{t("arbitrageBestAvailableDifference", { value: formatArs(bestComparable.grossSpreadPerUsd, language, true) })}</p> : <p className="mt-3 text-sm text-[var(--cma-text-muted)]">{t("arbitrageNoQuotes")}</p>}</div>}
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <QuoteRankingTable mode="buy" quotes={buyQuotes} providers={providers} language={language} t={translate} />
          <QuoteRankingTable mode="sell" quotes={sellQuotes} providers={providers} language={language} t={translate} />
        </div>
        <ArbitrageMatrix buyQuotes={buyQuotes} sellQuotes={sellQuotes} opportunities={matrix} providers={providers} language={language} t={translate} />
        <ArbitrageCalculator amount={amount} onAmountChange={setAmount} sourceId={selectedSource?.id ?? ""} destinationId={selectedDestination?.id ?? ""} onSourceChange={setSourceId} onDestinationChange={setDestinationId} buyQuotes={buyQuotes} sellQuotes={sellQuotes} opportunity={selectedOpportunity} providers={providers} language={language} t={translate} />

        <section className="cma-panel p-4 sm:p-5" data-testid="arbitrage-source-status">
          <h2 className="text-xl font-semibold text-[var(--cma-text-primary)]">{t("arbitrageSourcesStatus")}</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--cma-text-muted)]">{t("arbitrageSourcesDescription")}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {(payload?.providers ?? []).map((provider) => {
              const providerQuotes = payload?.quotes.filter((quote) => quote.providerId === provider.id) ?? [];
              const available = providerQuotes.length > 0;
              const partial = providerQuotes.some((quote) => quote.warnings.includes("observed_at_unavailable") || quote.warnings.includes("provider_partial_data"));
              return <article key={provider.id} className="rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-[var(--cma-text-primary)]">{provider.name}</p><p className="mt-1 text-xs text-[var(--cma-text-muted)]">{getProviderTypeLabel(provider.providerType, translate)} · {getProviderStatusLabel(provider.status, translate)}</p></div>{available ? <CheckCircle2 size={18} aria-label={partial ? t("arbitragePartialSource") : t("arbitrageActive")} className={partial ? "text-amber-300" : "text-emerald-300"} /> : <Clock3 size={18} aria-label={t("arbitrageUnavailable")} className="text-amber-300" />}</div><p className="mt-3 text-xs text-[var(--cma-text-secondary)]">{available ? t("arbitrageQuoteCount", { count: providerQuotes.length }) : t("arbitrageUnavailable")}{partial ? ` · ${t("arbitragePartialSource")}` : ""}</p></article>;
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function BestOpportunity({ opportunity, providers, language, t }: { opportunity: ArbitrageOpportunity; providers: Map<string, { name: string }>; language: "es" | "en"; t: ArbitrageTranslate }) {
  const source = providers.get(opportunity.sourceProviderId)?.name ?? opportunity.sourceProviderId;
  const destination = providers.get(opportunity.destinationProviderId)?.name ?? opportunity.destinationProviderId;
  const unknownCosts = opportunity.costStatus === "unknown";
  return <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">{unknownCosts ? t("arbitragePossibleGross") : t("arbitrageBestOpportunity")}</p>{unknownCosts ? <p className="mt-2 text-sm text-amber-200">{t("arbitragePossibleGrossWarning")}</p> : null}<div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center"><div className="rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] p-4"><p className="text-xs text-[var(--cma-text-muted)]">{t("arbitrageBuyIn", { provider: source })}</p><p className="mt-1 text-lg font-semibold text-[var(--cma-text-primary)]">{formatArs(opportunity.buyRate, language)}</p></div><ArrowRight aria-hidden="true" className="hidden text-[var(--cma-accent-cyan)] md:block" /><div className="rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] p-4"><p className="text-xs text-[var(--cma-text-muted)]">{t("arbitrageSellIn", { provider: destination })}</p><p className="mt-1 text-lg font-semibold text-[var(--cma-text-primary)]">{formatArs(opportunity.sellRate, language)}</p></div></div><dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div><dt className="text-xs text-[var(--cma-text-muted)]">{t("arbitrageGrossSpread")}</dt><dd className="mt-1 font-semibold text-emerald-300">{formatArs(opportunity.grossSpreadPerUsd, language, true)}</dd></div><div><dt className="text-xs text-[var(--cma-text-muted)]">{t("arbitrageAmount")}</dt><dd className="mt-1 font-semibold text-[var(--cma-text-primary)]">{formatUsd(opportunity.amountUsd, language)}</dd></div><div><dt className="text-xs text-[var(--cma-text-muted)]">{unknownCosts ? t("arbitrageGrossProfit") : t("arbitrageNetProfit")}</dt><dd className="mt-1 font-semibold text-emerald-300">{formatArs(opportunity.netProfitArs ?? opportunity.grossProfitArs, language, true)}</dd></div><div><dt className="text-xs text-[var(--cma-text-muted)]">{t("arbitrageCapitalRequired")}</dt><dd className="mt-1 font-semibold text-[var(--cma-text-primary)]">{formatArs(opportunity.capitalRequiredArs, language)}</dd></div></dl></div>;
}
