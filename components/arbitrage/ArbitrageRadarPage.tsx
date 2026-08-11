"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Info, RefreshCw, ShieldAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { buildOpportunityMatrix, calculateArbitrageOpportunity, findBestOpportunity, findBestPotentialDifference, getFreshnessStatus, rankBuyQuotes, rankSellQuotes } from "@/lib/arbitrage";
import { getProviderStatusLabel, getProviderTypeLabel, type ArbitrageTranslate } from "@/lib/arbitrage/labels";
import type { ArbitrageOpportunity, ArbitrageQuotesResponse, FxProvider, FxQuote, TransferAsset } from "@/lib/arbitrage/types";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { ArbitrageCalculator } from "./ArbitrageCalculator";
import { ArbitrageAlertDialog } from "./ArbitrageAlertDialog";
import { ArbitrageMatrix } from "./ArbitrageMatrix";
import { formatArs, formatTimestamp, formatUsd } from "./format";
import { ProviderLogo } from "./ProviderLogo";
import { ProviderQuoteCard } from "./ProviderQuoteCard";

const assets: TransferAsset[] = ["USD_BANK", "USDT", "USDC"];

function assetLabel(asset: TransferAsset, language: "es" | "en") {
  if (asset === "USD_BANK") return language === "es" ? "USD bancario" : "Bank USD";
  return asset;
}

export function getDefaultQuoteSelectionForAsset(quotes: FxQuote[], asset: TransferAsset) {
  const assetQuotes = quotes.filter((quote) => quote.transferAsset === asset);
  const buyQuotes = rankBuyQuotes(assetQuotes);
  const sellQuotes = rankSellQuotes(assetQuotes);
  const matrix = buildOpportunityMatrix(assetQuotes, 1000);
  const preferred = findBestOpportunity(matrix)
    ?? findBestPotentialDifference(matrix)
    ?? matrix
      .filter((item) => !item.blockers.includes("same_provider") && !item.blockers.includes("asset_mismatch"))
      .toSorted((left, right) => right.grossSpreadPerUsd - left.grossSpreadPerUsd)[0];
  const sourceId = preferred?.sourceQuoteId ?? buyQuotes[0]?.id ?? "";
  const sourceProviderId = assetQuotes.find((quote) => quote.id === sourceId)?.providerId;
  const destinationId = preferred?.destinationQuoteId
    ?? sellQuotes.find((quote) => quote.providerId !== sourceProviderId)?.id
    ?? "";
  return { sourceId, destinationId };
}

export function ArbitrageRadarPage() {
  const { language, t } = useLanguage();
  const translate = t as ArbitrageTranslate;
  const [payload, setPayload] = useState<ArbitrageQuotesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [amount, setAmount] = useState("1000");
  const [selectedAsset, setSelectedAsset] = useState<TransferAsset>("USD_BANK");
  const [sourceId, setSourceId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [onlyFresh, setOnlyFresh] = useState(false);
  const [alertOpportunity, setAlertOpportunity] = useState<ArbitrageOpportunity | null>(null);

  const loadQuotes = useCallback(async (forceRefresh: boolean, signal?: AbortSignal) => {
    if (forceRefresh) setRefreshing(true);
    setError(false);
    try {
      const response = await fetch(`/api/arbitrage/quotes${forceRefresh ? "?refresh=1" : ""}`, { signal, cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setPayload(await response.json() as ArbitrageQuotesResponse);
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
    queueMicrotask(() => void loadQuotes(false, controller.signal));
    return () => controller.abort();
  }, [loadQuotes]);

  useEffect(() => {
    const timer = window.setInterval(() => void loadQuotes(false), 60_000);
    return () => window.clearInterval(timer);
  }, [loadQuotes]);

  const amountUsd = Number.parseFloat(amount.replace(",", "."));
  const validAmount = Number.isFinite(amountUsd) && amountUsd > 0 ? amountUsd : 0;
  const providers = useMemo(() => new Map((payload?.providers ?? []).map((provider) => [provider.id, provider])), [payload]);
  const quotes = useMemo(() => (payload?.quotes ?? []).filter((quote) => {
    if (quote.transferAsset !== selectedAsset) return false;
    if (providers.get(quote.providerId)?.status !== "active") return false;
    if (onlyFresh && ["stale", "unverifiable"].includes(getFreshnessStatus(quote))) return false;
    return true;
  }), [onlyFresh, payload, providers, selectedAsset]);
  const buyQuotes = useMemo(() => rankBuyQuotes(quotes), [quotes]);
  const sellQuotes = useMemo(() => rankSellQuotes(quotes), [quotes]);
  const matrix = useMemo(() => validAmount ? buildOpportunityMatrix(quotes, validAmount) : [], [quotes, validAmount]);
  const best = useMemo(() => findBestOpportunity(matrix), [matrix]);
  const bestPotential = useMemo(() => findBestPotentialDifference(matrix), [matrix]);
  const bestComparable = useMemo(() => matrix
    .filter((item) => !item.blockers.includes("same_provider") && !item.blockers.includes("asset_mismatch") && item.buyRate > 0 && item.sellRate > 0)
    .toSorted((left, right) => right.grossSpreadPerUsd - left.grossSpreadPerUsd)[0], [matrix]);
  const defaults = useMemo(() => getDefaultQuoteSelectionForAsset(quotes, selectedAsset), [quotes, selectedAsset]);
  const selectedSource = buyQuotes.find((quote) => quote.id === sourceId) ?? buyQuotes.find((quote) => quote.id === defaults.sourceId);
  const destinationCandidates = sellQuotes.filter((quote) => quote.providerId !== selectedSource?.providerId);
  const selectedDestination = destinationCandidates.find((quote) => quote.id === destinationId)
    ?? destinationCandidates.find((quote) => quote.id === defaults.destinationId)
    ?? destinationCandidates[0];
  const selectedOpportunity = selectedSource && selectedDestination && validAmount
    ? calculateArbitrageOpportunity(selectedSource, selectedDestination, validAmount)
    : undefined;
  const bestBuyId = buyQuotes[0]?.id;
  const bestSellId = sellQuotes[0]?.id;

  function selectAsset(asset: TransferAsset) {
    setSelectedAsset(asset);
    setSourceId("");
    setDestinationId("");
  }

  function selectSource(nextSourceId: string) {
    setSourceId(nextSourceId);
    const providerId = quotes.find((quote) => quote.id === nextSourceId)?.providerId;
    if (quotes.find((quote) => quote.id === destinationId)?.providerId === providerId) setDestinationId("");
  }

  return (
    <AppShell>
      <div className="space-y-5 py-3 sm:py-5">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="cma-kicker">{t("arbitrageEyebrow")}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--cma-text-primary)]">{t("arbitrageTitle")}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--cma-text-secondary)]">{language === "es" ? "Compará cotizaciones públicas por activo sin mezclar USD bancario con stablecoins." : "Compare public quotes by asset without mixing bank USD with stablecoins."}</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden text-right text-[10px] leading-4 text-[var(--cma-text-muted)] sm:block">{payload ? t("arbitrageUpdatedAt", { time: formatTimestamp(payload.generatedAt, language) }) : loading ? t("arbitrageRefreshing") : ""}</p>
            <button type="button" onClick={() => void loadQuotes(true)} disabled={refreshing} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--cma-border-strong)] bg-[var(--cma-bg-panel)] px-4 text-sm font-semibold text-[var(--cma-text-primary)] transition hover:border-[var(--cma-accent-cyan)] disabled:opacity-60">
              <RefreshCw size={16} aria-hidden="true" className={refreshing ? "animate-spin" : ""} />{refreshing ? t("arbitrageRefreshing") : t("arbitrageRefresh")}
            </button>
          </div>
        </section>

        <section className="flex gap-3 rounded-xl border border-sky-400/20 bg-sky-400/10 p-4 text-sm leading-6 text-[var(--cma-text-secondary)]">
          <Info size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-sky-300" />
          <p><strong className="text-[var(--cma-text-primary)]">{language === "es" ? "Perspectiva del usuario:" : "User perspective:"}</strong> {language === "es" ? "“Comprás a” es el precio que pagás (ask/venta de la entidad). “Vendés a” es el precio que recibís (bid/compra de la entidad)." : "“You buy at” is the price you pay (provider ask). “You sell at” is the price you receive (provider bid)."}</p>
        </section>

        <section className="flex gap-3 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-xs leading-5 text-amber-200">
          <ShieldAlert size={17} aria-hidden="true" className="mt-0.5 shrink-0" /><p>{t("arbitrageDisclaimer")}</p>
        </section>

        {error ? <div role="alert" className="flex items-center gap-3 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200"><AlertTriangle size={18} aria-hidden="true" />{t("arbitrageLoadError")}</div> : null}

        <section aria-label={language === "es" ? "Activo comparado" : "Compared asset"} className="border-b border-[var(--cma-border-soft)]">
          <div className="flex gap-1 overflow-x-auto">
            {assets.map((asset) => {
              const active = selectedAsset === asset;
              const count = payload?.quotes.filter((quote) => quote.transferAsset === asset).length ?? 0;
              return <button key={asset} type="button" onClick={() => selectAsset(asset)} aria-pressed={active} className={`relative min-h-12 shrink-0 px-4 text-sm font-semibold transition ${active ? "text-[var(--cma-accent-cyan)]" : "text-[var(--cma-text-muted)] hover:text-[var(--cma-text-primary)]"}`}>{assetLabel(asset, language)}<span className="ml-2 rounded-full border border-[var(--cma-border-soft)] px-1.5 py-0.5 text-[10px]">{count}</span>{active ? <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[var(--cma-accent-cyan)]" /> : null}</button>;
            })}
          </div>
        </section>

        <section className="rounded-xl border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] p-4 sm:p-5" data-testid="best-arbitrage-opportunity">
          <OpportunitySummary opportunity={best ?? bestPotential ?? bestComparable} verified={Boolean(best)} potential={Boolean(bestPotential)} providers={providers} language={language} />
        </section>

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]">
          <section className="min-w-0" data-testid="arbitrage-quote-cards">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--cma-text-muted)]">{language === "es" ? `Cotizaciones de ${assetLabel(selectedAsset, language)}` : `${assetLabel(selectedAsset, language)} quotes`}</h2>
                <p className="mt-1 text-xs text-[var(--cma-text-muted)]">{language === "es" ? `${quotes.length} cotización(es) comparables en este activo.` : `${quotes.length} comparable quote(s) for this asset.`}</p>
              </div>
              <div className="inline-flex rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] p-1" aria-label={language === "es" ? "Filtro de frescura" : "Freshness filter"}>
                <button type="button" onClick={() => setOnlyFresh(false)} aria-pressed={!onlyFresh} className={`min-h-9 rounded-md px-3 text-xs font-semibold ${!onlyFresh ? "bg-[var(--cma-bg-elevated)] text-[var(--cma-text-primary)]" : "text-[var(--cma-text-muted)]"}`}>{language === "es" ? "Todas" : "All"}</button>
                <button type="button" onClick={() => setOnlyFresh(true)} aria-pressed={onlyFresh} className={`min-h-9 rounded-md px-3 text-xs font-semibold ${onlyFresh ? "bg-[var(--cma-bg-elevated)] text-[var(--cma-text-primary)]" : "text-[var(--cma-text-muted)]"}`}>{language === "es" ? "Hora fuente verificada" : "Verified source time"}</button>
              </div>
            </div>

            {quotes.length ? <div className="mt-4 grid gap-4 md:grid-cols-2">{buyQuotes.map((quote) => <ProviderQuoteCard key={quote.id} quote={quote} provider={providers.get(quote.providerId)} asset={selectedAsset} isBestBuy={quote.id === bestBuyId} isBestSell={quote.id === bestSellId} language={language} t={translate} />)}</div> : <div className="mt-4 rounded-xl border border-dashed border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] p-8 text-center"><Clock3 size={22} aria-hidden="true" className="mx-auto text-[var(--cma-text-muted)]" /><p className="mt-2 text-sm font-semibold text-[var(--cma-text-primary)]">{t("arbitrageNoQuotes")}</p></div>}
          </section>

          <aside className="min-w-0 space-y-5">
            <ArbitrageMatrix buyQuotes={buyQuotes} sellQuotes={sellQuotes} opportunities={matrix} providers={providers} language={language} asset={selectedAsset} t={translate} />
            <ArbitrageCalculator amount={amount} onAmountChange={setAmount} sourceId={selectedSource?.id ?? ""} destinationId={selectedDestination?.id ?? ""} onSourceChange={selectSource} onDestinationChange={setDestinationId} buyQuotes={buyQuotes} sellQuotes={sellQuotes} opportunity={selectedOpportunity} providers={providers} asset={selectedAsset} language={language} t={translate} onCreateAlert={setAlertOpportunity} />
          </aside>
        </div>

        <section className="rounded-xl border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] p-4 sm:p-5" data-testid="arbitrage-source-status">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--cma-text-muted)]">{t("arbitrageSourcesStatus")}</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--cma-text-muted)]">{t("arbitrageSourcesDescription")}</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(payload?.providers ?? []).map((provider) => <ProviderStatusCard key={provider.id} provider={provider} quotes={payload?.quotes.filter((quote) => quote.providerId === provider.id) ?? []} language={language} t={translate} />)}
          </div>
        </section>
        <ArbitrageAlertDialog
          open={Boolean(alertOpportunity)}
          opportunity={alertOpportunity}
          sourceProvider={alertOpportunity ? providers.get(alertOpportunity.sourceProviderId) : undefined}
          destinationProvider={alertOpportunity ? providers.get(alertOpportunity.destinationProviderId) : undefined}
          asset={selectedAsset}
          onClose={() => setAlertOpportunity(null)}
        />
      </div>
    </AppShell>
  );
}

function OpportunitySummary({ opportunity, verified, potential, providers, language }: { opportunity?: ArbitrageOpportunity; verified: boolean; potential: boolean; providers: Map<string, FxProvider>; language: "es" | "en" }) {
  const positive = Boolean(opportunity && opportunity.grossSpreadPerUsd > 0);
  const title = verified
    ? (language === "es" ? "Oportunidad verificada" : "Verified opportunity")
    : potential
      ? (language === "es" ? "Posible diferencia bruta" : "Possible gross difference")
      : (language === "es" ? "Sin oportunidades verificadas" : "No verified opportunities");
  if (!opportunity) return <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--cma-text-muted)]">{language === "es" ? "Datos insuficientes" : "Insufficient data"}</p><p className="mt-2 text-sm text-[var(--cma-text-muted)]">{language === "es" ? "Se necesitan dos proveedores comparables dentro del mismo activo." : "Two comparable providers for the same asset are required."}</p></div>;
  const source = providers.get(opportunity.sourceProviderId)?.name ?? opportunity.sourceProviderId;
  const destination = providers.get(opportunity.destinationProviderId)?.name ?? opportunity.destinationProviderId;
  return <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className={`text-xs font-semibold uppercase tracking-[0.15em] ${verified ? "text-emerald-300" : potential ? "text-amber-300" : "text-[var(--cma-text-muted)]"}`}>{title}</p><p className="mt-2 text-sm text-[var(--cma-text-secondary)]">{positive ? (language === "es" ? "La diferencia sigue sujeta a costos, límites y capacidades verificadas." : "The difference remains subject to verified costs, limits and capabilities.") : (language === "es" ? "La mejor combinación comparable no presenta una diferencia positiva." : "The best comparable combination does not show a positive difference.")}</p></div><div className="flex flex-wrap items-center gap-3"><span className="text-xs font-semibold text-[var(--cma-text-primary)]">{source}</span><ArrowRight size={15} aria-hidden="true" className="text-[var(--cma-accent-cyan)]" /><span className="text-xs font-semibold text-[var(--cma-text-primary)]">{destination}</span><span className={`cma-metric rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] px-3 py-2 text-sm font-semibold ${positive ? "text-emerald-300" : "text-rose-300"}`}>{formatArs(opportunity.grossSpreadPerUsd, language, true)} / u.</span>{verified ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300"><CheckCircle2 size={14} aria-hidden="true" />{formatUsd(opportunity.amountUsd, language)}</span> : null}</div></div>;
}

function ProviderStatusCard({ provider, quotes, language, t }: { provider: FxProvider; quotes: FxQuote[]; language: "es" | "en"; t: ArbitrageTranslate }) {
  const available = quotes.length > 0;
  const partial = quotes.some((quote) => quote.warnings.includes("observed_at_unavailable") || quote.warnings.includes("provider_partial_data"));
  return <article className="rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] p-3"><div className="flex items-start gap-3"><ProviderLogo providerId={provider.id} providerName={provider.name} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-[var(--cma-text-primary)]">{provider.name}</p><p className="mt-1 text-[10px] text-[var(--cma-text-muted)]">{getProviderTypeLabel(provider.providerType, t)} · {getProviderStatusLabel(provider.status, t)}</p></div>{available ? <CheckCircle2 size={15} aria-label={partial ? t("arbitragePartialSource") : t("arbitrageActive")} className={partial ? "text-amber-300" : "text-emerald-300"} /> : <Clock3 size={15} aria-label={t("arbitrageProviderUnavailable")} className="text-[var(--cma-text-muted)]" />}</div><p className="mt-3 text-[10px] text-[var(--cma-text-secondary)]">{available ? t("arbitrageQuoteCount", { count: quotes.length }) : t("arbitrageProviderUnavailable")}</p><p className="mt-1 text-[10px] text-[var(--cma-text-muted)]">{provider.operates24x7 ? "24/7" : (language === "es" ? "Horario o disponibilidad no 24/7" : "Not 24/7 or schedule unverified")}</p></article>;
}
