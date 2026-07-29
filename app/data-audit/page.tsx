"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { SortableTableHeader } from "@/components/ui/SortableTableHeader";
import { DataCoverageBadges } from "@/components/data-coverage/DataCoverageBadges";
import { ProviderStatusPanel } from "@/components/providers/ProviderStatusPanel";
import { cnvIssuers } from "@/lib/cnv";
import { getInstrumentContextCoverage, getCoverageStatusLabel } from "@/lib/data-coverage";
import { getAnalysisCoverage, getAnalysisCoverageSummary } from "@/lib/analysis/analysis-coverage";
import { instrumentUniverse } from "@/lib/instrument-universe/universe";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { formatCurrencyValue } from "@/lib/formatters";
import type { ArgentinaInstrument, ArgentinaQuote, ArgentinaSourceStatus } from "@/lib/argentina";
import type { ProviderVerificationResult } from "@/lib/providers";
import { nextSortState, sortTableRows, type SortState } from "@/lib/ui/sortable-table";

type FundamentalsAuditSnapshot = {
  provider?: string;
  sourceLabel?: string;
  coverageRatio?: number;
  missingFields?: string[];
};
type CoverageSortKey = "symbol" | "type" | "market" | "technical" | "fundamentals" | "fixedIncome" | "chart" | "notes";
type ArgentinaAuditSortKey = "symbol" | "name" | "price" | "source" | "real" | "updated" | "status";
type UniverseAuditSortKey = "symbol" | "name" | "category" | "market" | "coverage" | "provider" | "note";

const auditSymbols = new Set([
  "AAPL",
  "MSFT",
  "NVDA",
  "TSLA",
  "AMZN",
  "SPY",
  "QQQ",
  "BTC-USD",
  "ETH-USD",
  "SOL-USD",
  "AL30",
  "AL30D",
  "GD30",
  "TX26",
  "GGAL",
  "YPFD",
]);
const argentinaAuditSymbols = ["AL30", "GD30", "TX26", "GGAL", "YPFD", "AAPL"];

function formatCategory(category: string) {
  return category.replaceAll("_", " ");
}

function formatProviderName(provider: string, isSpanish: boolean) {
  if (provider === "fmp") return "FMP";
  if (provider === "yahoo") return isSpanish ? "Yahoo compatible" : "Yahoo-compatible";
  if (provider === "mock" || provider === "unavailable") return isSpanish ? "No disponible" : "Unavailable";
  return provider.replaceAll("_", " ");
}

function argentinaSourceLabel(source: string, isSpanish: boolean) {
  if (source === "yahoo") return isSpanish ? "Yahoo Finance (no oficial)" : "Yahoo Finance (unofficial)";
  if (source === "manual") return isSpanish ? "Carga manual validada" : "Validated manual load";
  if (source === "mock" || source === "unavailable") return isSpanish ? "No disponible" : "Unavailable";
  if (source === "byma_future") return isSpanish ? "Integración BYMA futura" : "Future BYMA integration";
  if (source === "cnv_future") return isSpanish ? "CNV futura" : "Future CNV";
  if (source === "broker_future") return isSpanish ? "Broker/API futuro" : "Future broker/API";
  return isSpanish ? "No disponible" : "Unavailable";
}

function formatCoverageNote(note: string, isSpanish: boolean) {
  if (!isSpanish) return note;
  if (note.toLowerCase().includes("provider underlying") || note.toLowerCase().includes("cedear")) {
    return "El subyacente usa proveedor. Precio local y CCL implicito solo se publican cuando la fuente argentina responde y el ratio esta validado.";
  }
  return note;
}

function getTraceSummary(verification: ProviderVerificationResult, isSpanish: boolean) {
  const fmpTrace = verification.providerTrace.find((item) => item.provider === "fmp");
  const yahooTrace = verification.providerTrace.find((item) => item.provider === "yahoo" && item.success);

  if (fmpTrace?.reason === "plan_restricted" && yahooTrace) {
    return isSpanish
      ? "FMP fue consultado, pero el endpoint de cotización está restringido por el plan actual. Se utilizó Yahoo compatible como fuente efectiva."
      : "FMP was attempted, but the quote endpoint is restricted by the current plan. Yahoo-compatible data was used as the actual source.";
  }

  if (verification.actualProvider === "yahoo") {
    return isSpanish
      ? "Yahoo compatible entrego la cotizacion efectiva para esta consulta."
      : "Yahoo-compatible data returned the effective quote for this request.";
  }

  if (verification.actualProvider === "fmp") {
    return isSpanish ? "FMP entregó datos válidos para este endpoint." : "FMP returned valid data for this endpoint.";
  }

  if (verification.actualProvider === "mock") {
    return isSpanish ? "La cotizacion no esta disponible." : "The quote is unavailable.";
  }

  return verification.sourceLabel;
}

function QuoteSourceCell({ symbol }: { symbol: string }) {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const [verification, setVerification] = useState<ProviderVerificationResult | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch(`/api/providers/verify/${encodeURIComponent(symbol)}`);
        if (!active || !response.ok) return;
        setVerification(await response.json());
      } catch {
        if (active) setVerification(null);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [symbol]);

  if (!verification) {
    return (
      <span className="text-xs text-slate-500">
        {isSpanish ? "Proveedor efectivo: se consulta en página de activo" : "Actual provider: fetched on asset page"}
      </span>
    );
  }

  const providerMismatch = verification.configuredProvider !== verification.actualProvider;

  return (
    <div className="space-y-1 text-xs leading-5 text-slate-400">
      <p>
        {isSpanish ? "Proveedor configurado" : "Configured provider"}:{" "}
        <span className="font-medium text-slate-200">{formatProviderName(verification.configuredProvider, isSpanish)}</span>
      </p>
      <p>
        {isSpanish ? "Proveedor efectivo" : "Actual provider"}:{" "}
        <span className={verification.isFallback ? "font-medium text-cyan-100" : "font-medium text-emerald-100"}>
          {formatProviderName(verification.actualProvider, isSpanish)}
        </span>
      </p>
      <p>{getTraceSummary(verification, isSpanish)}</p>
      {providerMismatch ? (
        <p className="text-amber-100">
          {isSpanish
            ? "FMP restringido por plan para este endpoint."
            : "FMP plan-restricted for this endpoint."}
        </p>
      ) : null}
      <p>
        {isSpanish ? "Cadena" : "Chain"}: {verification.fallbackChain.join(" -> ")}
      </p>
    </div>
  );
}

export default function DataAuditPage() {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const [argentinaQuotes, setArgentinaQuotes] = useState<Record<string, ArgentinaQuote>>({});
  const [argentinaInstruments, setArgentinaInstruments] = useState<ArgentinaInstrument[]>([]);
  const [argentinaSources, setArgentinaSources] = useState<ArgentinaSourceStatus[]>([]);
  const [fundamentalsAudit, setFundamentalsAudit] = useState<FundamentalsAuditSnapshot | null>(null);
  const [coverageSort, setCoverageSort] = useState<SortState<CoverageSortKey>>({ key: "symbol", direction: "asc" });
  const [argentinaSort, setArgentinaSort] = useState<SortState<ArgentinaAuditSortKey>>({ key: "symbol", direction: "asc" });
  const [universeSort, setUniverseSort] = useState<SortState<UniverseAuditSortKey>>({ key: "symbol", direction: "asc" });
  const auditItems = instrumentUniverse.filter(
    (instrument) =>
      auditSymbols.has(instrument.symbol) ||
      (instrument.symbol === "AAPL" && instrument.category === "cedear"),
  );
  const analysisCoverageItems = instrumentUniverse
    .filter((instrument) => auditSymbols.has(instrument.symbol) || instrument.priority && instrument.priority >= 7)
    .map((instrument) => getAnalysisCoverage(instrument.symbol));
  const analysisSummary = getAnalysisCoverageSummary(analysisCoverageItems);
  const sortedAnalysisCoverageItems = useMemo(() => sortTableRows(analysisCoverageItems, coverageSort, {
    symbol: (item) => item.symbol,
    type: (item) => item.assetType,
    market: (item) => item.market,
    technical: (item) => item.technical.status,
    fundamentals: (item) => item.fundamentals.status,
    fixedIncome: (item) => item.fixedIncome.status,
    chart: (item) => item.chart.verified ? item.chart.tradingViewSymbol : null,
    notes: (item) => `${item.technical.reason} ${item.fundamentals.reason} ${item.fixedIncome.reason}`,
  }), [analysisCoverageItems, coverageSort]);

  useEffect(() => {
    let active = true;

    async function loadArgentinaAudit() {
      try {
        const [quotesResponse, instrumentsResponse, statusResponse] = await Promise.all([
          fetch(`/api/argentina/quotes?symbols=${argentinaAuditSymbols.join(",")}`),
          fetch("/api/argentina/instruments"),
          fetch("/api/argentina/status"),
        ]);
        if (!active) return;
        if (quotesResponse.ok) {
          const data = (await quotesResponse.json()) as { quotes?: Record<string, ArgentinaQuote> };
          setArgentinaQuotes(data.quotes ?? {});
        }
        if (instrumentsResponse.ok) {
          const data = (await instrumentsResponse.json()) as { instruments?: ArgentinaInstrument[] };
          setArgentinaInstruments(data.instruments ?? []);
        }
        if (statusResponse.ok) {
          const data = (await statusResponse.json()) as { sources?: ArgentinaSourceStatus[] };
          setArgentinaSources(data.sources ?? []);
        }
      } catch {
        if (active) {
          setArgentinaQuotes({});
          setArgentinaInstruments([]);
          setArgentinaSources([]);
        }
      }
    }

    void loadArgentinaAudit();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadFundamentalsAudit() {
      try {
        const response = await fetch("/api/analysis/fundamentals/AAPL?debug=1");
        if (!active || !response.ok) return;
        setFundamentalsAudit((await response.json()) as FundamentalsAuditSnapshot);
      } catch {
        if (active) setFundamentalsAudit(null);
      }
    }

    void loadFundamentalsAudit();
    return () => {
      active = false;
    };
  }, []);

  const argentinaAuditItems = argentinaAuditSymbols
    .map((symbol) => argentinaInstruments.find((instrument) => instrument.symbol === symbol))
    .filter((instrument): instrument is ArgentinaInstrument => Boolean(instrument));
  const sortedArgentinaAuditItems = useMemo(() => sortTableRows(argentinaAuditItems, argentinaSort, {
    symbol: (item) => item.displaySymbol,
    name: (item) => item.name,
    price: (item) => argentinaQuotes[item.symbol]?.price,
    source: (item) => argentinaQuotes[item.symbol]?.source ?? item.sourceStatus,
    real: (item) => argentinaQuotes[item.symbol]?.isRealData,
    updated: (item) => {
      const updatedAt = argentinaQuotes[item.symbol]?.lastUpdated;
      return updatedAt ? new Date(updatedAt) : null;
    },
    status: (item) => argentinaQuotes[item.symbol]?.isRealData,
  }), [argentinaAuditItems, argentinaQuotes, argentinaSort]);
  const sortedAuditItems = useMemo(() => sortTableRows(auditItems, universeSort, {
    symbol: (item) => item.symbol,
    name: (item) => item.displayName,
    category: (item) => item.category,
    market: (item) => item.market,
    coverage: (item) => Object.values(item.dataCoverage).filter(Boolean).length,
    provider: (item) => item.sourceStatus,
    note: (item) => getInstrumentContextCoverage(item.symbol, { category: item.category, country: item.country }).notes?.[0],
  }), [auditItems, universeSort]);

  return (
    <AppShell>
      <div className="space-y-8 py-6">
        <section className="cma-panel-elevated cma-glow-cyan p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
            CMA Market Intelligence
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            {isSpanish ? "Auditoría de datos" : "Data Audit"}
          </h1>
          <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-300">
            {isSpanish
              ? "Revision de cobertura efectiva por instrumento, proveedor y capa analitica."
              : "Review of effective coverage by instrument, provider, and analytical layer."}
          </p>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">
            {isSpanish
              ? "Esta pagina diferencia rutas configuradas, respuestas efectivas y campos no disponibles."
              : "This page separates configured routes, effective responses, and unavailable fields."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/methodology" className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100">
              {isSpanish ? "Ver metodología" : "View methodology"}
            </Link>
            <Link href="/status" className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300">
              {isSpanish ? "Ver estado" : "View status"}
            </Link>
          </div>
        </section>

        <ProviderStatusPanel />

        <section className="cma-panel cma-card-argentina p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
            {isSpanish ? "Paridad produccion/local" : "Production/local parity"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {isSpanish ? "Diagnostico de despliegue y proveedores" : "Deployment and provider diagnostics"}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
            {isSpanish
              ? "Usar estos endpoints para comparar localhost contra Vercel sin exponer secretos."
              : "Use these endpoints to compare localhost against Vercel without exposing secrets."}
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Link href="/api/diagnostics/runtime" className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-cyan-100">
              /api/diagnostics/runtime
            </Link>
            <Link href="/api/analysis/fundamentals/AAPL?debug=1" className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-cyan-100">
              /api/analysis/fundamentals/AAPL?debug=1
            </Link>
            <Link href="/api/news/AAPL" className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-cyan-100">
              /api/news/AAPL
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                {isSpanish ? "Fundamentales AAPL" : "AAPL fundamentals"}
              </p>
              <p className="mt-2">
                {fundamentalsAudit?.coverageRatio !== undefined
                  ? `${Math.round(fundamentalsAudit.coverageRatio * 100)}% ${isSpanish ? "cobertura" : "coverage"}`
                  : "N/D"}
              </p>
              <p className="mt-1 text-xs text-slate-500">{fundamentalsAudit?.sourceLabel ?? fundamentalsAudit?.provider ?? "N/D"}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                {isSpanish ? "Noticias" : "News"}
              </p>
              <p className="mt-2">{isSpanish ? "RSS o proveedor; N/D si no responden" : "RSS or provider; N/A if unavailable"}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                {isSpanish ? "Sanitizacion" : "Sanitization"}
              </p>
              <p className="mt-2">
                {isSpanish ? "Aplicada en servicio, API y UI de noticias." : "Applied in news service, API and UI."}
              </p>
            </div>
          </div>
          <Link href="/methodology" className="mt-4 inline-flex text-sm font-medium text-emerald-100">
            {isSpanish ? "Ver metodologia y checklist operativo" : "View methodology and operating checklist"}
          </Link>
        </section>

        <section className="cma-panel overflow-hidden" data-testid="analysis-coverage-matrix">
          <div className="border-b border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
              {isSpanish ? "Matriz de cobertura analitica" : "Analysis coverage matrix"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {isSpanish ? "Tecnico, fundamentos, renta fija y grafico" : "Technical, fundamentals, fixed income and chart"}
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
              {isSpanish
                ? "Esta matriz separa disponibilidad analitica por instrumento. No mezcla configuracion de proveedor con cobertura efectiva por simbolo."
                : "This matrix separates analytical availability by instrument. It does not mix provider configuration with per-symbol coverage."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-cyan-100">
                Technical: {analysisSummary.technicalCount}
              </span>
              <span className="rounded-full border border-violet-300/25 bg-violet-300/10 px-3 py-1 text-violet-100">
                Fundamentals: {analysisSummary.fundamentalCount}
              </span>
              <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-amber-100">
                Fixed income: {analysisSummary.fixedIncomeCount}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-300">
                Chart: {analysisSummary.chartCount}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[1080px] w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <SortableTableHeader columnKey="symbol" label="Symbol" activeKey={coverageSort.key} direction={coverageSort.direction} onSort={(key) => setCoverageSort((current) => nextSortState(current, key))} />
                  <SortableTableHeader columnKey="type" label={isSpanish ? "Tipo" : "Type"} activeKey={coverageSort.key} direction={coverageSort.direction} onSort={(key) => setCoverageSort((current) => nextSortState(current, key))} />
                  <SortableTableHeader columnKey="market" label={isSpanish ? "Mercado" : "Market"} activeKey={coverageSort.key} direction={coverageSort.direction} onSort={(key) => setCoverageSort((current) => nextSortState(current, key))} />
                  <SortableTableHeader columnKey="technical" label={isSpanish ? "Tecnico" : "Technical"} activeKey={coverageSort.key} direction={coverageSort.direction} onSort={(key) => setCoverageSort((current) => nextSortState(current, key))} />
                  <SortableTableHeader columnKey="fundamentals" label={isSpanish ? "Fundamentos" : "Fundamentals"} activeKey={coverageSort.key} direction={coverageSort.direction} onSort={(key) => setCoverageSort((current) => nextSortState(current, key))} />
                  <SortableTableHeader columnKey="fixedIncome" label={isSpanish ? "Renta fija" : "Fixed income"} activeKey={coverageSort.key} direction={coverageSort.direction} onSort={(key) => setCoverageSort((current) => nextSortState(current, key))} />
                  <SortableTableHeader columnKey="chart" label={isSpanish ? "Grafico" : "Chart"} activeKey={coverageSort.key} direction={coverageSort.direction} onSort={(key) => setCoverageSort((current) => nextSortState(current, key))} />
                  <SortableTableHeader columnKey="notes" label={isSpanish ? "Notas" : "Notes"} activeKey={coverageSort.key} direction={coverageSort.direction} onSort={(key) => setCoverageSort((current) => nextSortState(current, key))} />
                </tr>
              </thead>
              <tbody>
                {sortedAnalysisCoverageItems.map((coverage, index) => (
                  <tr key={`${coverage.symbol}-${coverage.assetType}-${coverage.market ?? "unknown"}-${index}`} className="border-b border-white/10 last:border-b-0">
                    <td className="px-4 py-4 font-semibold text-white">{coverage.symbol}</td>
                    <td className="px-4 py-4 text-slate-300">{formatCategory(coverage.assetType)}</td>
                    <td className="px-4 py-4 text-slate-400">{coverage.market ?? "N/D"}</td>
                    <td className="px-4 py-4 text-slate-300">{coverage.technical.status}</td>
                    <td className="px-4 py-4 text-slate-300">
                      {coverage.fundamentals.status}
                      {coverage.fundamentals.underlyingSymbol ? (
                        <span className="ml-2 text-xs text-violet-200">({coverage.fundamentals.underlyingSymbol})</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-slate-300">{coverage.fixedIncome.status}</td>
                    <td className="px-4 py-4 text-slate-300">
                      {coverage.chart.verified ? coverage.chart.tradingViewSymbol : isSpanish ? "No verificado" : "Unverified"}
                    </td>
                    <td className="px-4 py-4 text-xs leading-5 text-slate-400">
                      {coverage.technical.reason} {coverage.fundamentals.reason} {coverage.fixedIncome.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="cma-panel cma-card-argentina p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
            {isSpanish ? "Argentina quote source" : "Argentina quote source"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {isSpanish ? "Auditoría de datos Argentina" : "Argentina data audit"}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
            {isSpanish
              ? "Esta seccion identifica la fuente efectiva de cada cotizacion argentina y las rutas oficiales pendientes."
              : "This section identifies the effective source of each Argentine quote and pending official routes."}
          </p>
          <p className="mt-2 text-xs font-medium text-slate-500">provider / manual / unavailable</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {argentinaSources.map((source) => (
              <span key={source.source} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                {argentinaSourceLabel(source.source, isSpanish)} | {source.mode}
              </span>
            ))}
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-[940px] w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <SortableTableHeader columnKey="symbol" label="Symbol" activeKey={argentinaSort.key} direction={argentinaSort.direction} onSort={(key) => setArgentinaSort((current) => nextSortState(current, key))} className="px-3" />
                  <SortableTableHeader columnKey="name" label={isSpanish ? "Nombre" : "Name"} activeKey={argentinaSort.key} direction={argentinaSort.direction} onSort={(key) => setArgentinaSort((current) => nextSortState(current, key))} className="px-3" />
                  <SortableTableHeader columnKey="price" label={isSpanish ? "Precio" : "Price"} activeKey={argentinaSort.key} direction={argentinaSort.direction} onSort={(key) => setArgentinaSort((current) => nextSortState(current, key, "desc"))} className="px-3" />
                  <SortableTableHeader columnKey="source" label={isSpanish ? "Fuente" : "Source"} activeKey={argentinaSort.key} direction={argentinaSort.direction} onSort={(key) => setArgentinaSort((current) => nextSortState(current, key))} className="px-3" />
                  <SortableTableHeader columnKey="real" label={isSpanish ? "Dato real" : "Real data"} activeKey={argentinaSort.key} direction={argentinaSort.direction} onSort={(key) => setArgentinaSort((current) => nextSortState(current, key, "desc"))} className="px-3" />
                  <SortableTableHeader columnKey="updated" label={isSpanish ? "Actualizado" : "Updated"} activeKey={argentinaSort.key} direction={argentinaSort.direction} onSort={(key) => setArgentinaSort((current) => nextSortState(current, key, "desc"))} className="px-3" />
                  <SortableTableHeader columnKey="status" label={isSpanish ? "Estado" : "Status"} activeKey={argentinaSort.key} direction={argentinaSort.direction} onSort={(key) => setArgentinaSort((current) => nextSortState(current, key, "desc"))} className="px-3" />
                </tr>
              </thead>
              <tbody>
                {sortedArgentinaAuditItems.map((instrument) => {
                  const quote = argentinaQuotes[instrument.symbol];
                  return (
                    <tr key={instrument.symbol} className="border-b border-white/10 last:border-b-0">
                      <td className="px-3 py-3 font-semibold text-white">{instrument.displaySymbol}</td>
                      <td className="px-3 py-3 text-slate-300">{instrument.name}</td>
                      <td className="px-3 py-3 text-slate-300">
                        {quote?.price === null || quote?.price === undefined ? "N/D" : formatCurrencyValue(quote.price, quote.currency, language)}
                      </td>
                      <td className="px-3 py-3 text-slate-300">{argentinaSourceLabel(quote?.source ?? instrument.sourceStatus, isSpanish)}</td>
                      <td className="px-3 py-3 text-slate-300">{quote?.isRealData ? (isSpanish ? "Sí" : "Yes") : "No"}</td>
                      <td className="px-3 py-3 text-xs text-slate-500">{quote?.lastUpdated ?? "N/D"}</td>
                      <td className="px-3 py-3 text-xs text-slate-400">
                        {quote?.isRealData
                          ? isSpanish ? "Cotizacion disponible" : "Quote available"
                          : isSpanish ? "No disponible" : "Unavailable"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="cma-panel cma-card-argentina p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
            {isSpanish ? "Cobertura objetivo del universo" : "Target universe coverage"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {isSpanish ? "Cobertura local pendiente" : "Pending local coverage"}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
            {isSpanish
              ? "Los subyacentes internacionales usan proveedores globales. Las cotizaciones locales dependen de PPI, data912 u otra fuente argentina configurada; cuando no responden se informa N/D."
              : "International underlyings use global providers. Local quotes depend on PPI, data912, or another configured Argentine source; when none responds the result is N/A."}
          </p>
        </section>

        <section className="cma-panel cma-card-argentina p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
            {isSpanish ? "CNV source/status" : "CNV source/status"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {isSpanish ? "Cobertura documental CNV" : "CNV document coverage"}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
            {isSpanish
              ? "La app no publica documentos de demostracion. Los hechos relevantes y estados financieros se incorporaran cuando exista una consulta oficial o publica autorizada. CNV no se usa para precios en vivo."
              : "The app does not publish demo documents. Relevant events and financial statements will be added when an official or authorized public query is available. CNV is not used for live prices."}
          </p>
          <p className="mt-4 text-sm text-slate-300">
            {isSpanish ? "Emisoras registradas" : "Registered issuers"}: {cnvIssuers.map((issuer) => issuer.symbol).join(", ")}
          </p>
        </section>

        <section className="cma-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[1120px] w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <SortableTableHeader columnKey="symbol" label="Symbol" activeKey={universeSort.key} direction={universeSort.direction} onSort={(key) => setUniverseSort((current) => nextSortState(current, key))} />
                  <SortableTableHeader columnKey="name" label={isSpanish ? "Nombre" : "Name"} activeKey={universeSort.key} direction={universeSort.direction} onSort={(key) => setUniverseSort((current) => nextSortState(current, key))} />
                  <SortableTableHeader columnKey="category" label={isSpanish ? "Categoria" : "Category"} activeKey={universeSort.key} direction={universeSort.direction} onSort={(key) => setUniverseSort((current) => nextSortState(current, key))} />
                  <SortableTableHeader columnKey="market" label={isSpanish ? "Mercado" : "Market"} activeKey={universeSort.key} direction={universeSort.direction} onSort={(key) => setUniverseSort((current) => nextSortState(current, key))} />
                  <SortableTableHeader columnKey="coverage" label={isSpanish ? "Cobertura" : "Coverage"} activeKey={universeSort.key} direction={universeSort.direction} onSort={(key) => setUniverseSort((current) => nextSortState(current, key, "desc"))} />
                  <SortableTableHeader columnKey="provider" label={isSpanish ? "Proveedor efectivo" : "Actual provider"} activeKey={universeSort.key} direction={universeSort.direction} onSort={(key) => setUniverseSort((current) => nextSortState(current, key))} />
                  <th className="px-4 py-3">{isSpanish ? "Reporte" : "Report"}</th>
                  <SortableTableHeader columnKey="note" label={isSpanish ? "Nota" : "Note"} activeKey={universeSort.key} direction={universeSort.direction} onSort={(key) => setUniverseSort((current) => nextSortState(current, key))} />
                </tr>
              </thead>
              <tbody>
                {sortedAuditItems.map((instrument) => {
                  const coverage = getInstrumentContextCoverage(instrument.symbol, {
                    category: instrument.category,
                    country: instrument.country,
                  });
                  const note = coverage.notes?.[0] ?? (isSpanish ? "Sin nota adicional." : "No additional note.");

                  return (
                    <tr
                      key={`${instrument.country}-${instrument.market}-${instrument.symbol}-${instrument.category}`}
                      className="border-b border-white/10 last:border-b-0"
                    >
                      <td className="px-4 py-4 font-semibold text-white">{instrument.symbol}</td>
                      <td className="px-4 py-4 text-slate-300">{instrument.displayName}</td>
                      <td className="px-4 py-4 text-slate-400">{formatCategory(instrument.category)}</td>
                      <td className="px-4 py-4 text-slate-400">{instrument.market}</td>
                      <td className="px-4 py-4">
                        <DataCoverageBadges
                          symbol={instrument.symbol}
                          category={instrument.category}
                          country={instrument.country}
                          compact
                          layers={["price", "chart", "technical", "fundamentals", "fixed_income", "news"]}
                        />
                        <span className="sr-only">
                          {getCoverageStatusLabel(coverage.price, language)} {getCoverageStatusLabel(coverage.technical, language)}{" "}
                          {getCoverageStatusLabel(coverage.fundamentals, language)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <QuoteSourceCell symbol={instrument.symbol} />
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/report/${encodeURIComponent(instrument.symbol)}`}
                          className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-xs font-medium text-cyan-100"
                        >
                          {isSpanish ? "Ver reporte" : "View report"}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-xs leading-5 text-slate-400">{formatCoverageNote(note, isSpanish)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
