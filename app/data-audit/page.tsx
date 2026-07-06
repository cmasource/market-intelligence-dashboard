"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { CnvDocumentsPanel } from "@/components/cnv/CnvDocumentsPanel";
import { DataCoverageBadges } from "@/components/data-coverage/DataCoverageBadges";
import { ProviderStatusPanel } from "@/components/providers/ProviderStatusPanel";
import { cnvIssuers, getCnvSourceStatus, getLatestCnvDocuments } from "@/lib/cnv";
import { getInstrumentContextCoverage, getCoverageStatusLabel } from "@/lib/data-coverage";
import { getAnalysisCoverage, getAnalysisCoverageSummary } from "@/lib/analysis/analysis-coverage";
import { instrumentUniverse } from "@/lib/instrument-universe/universe";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { formatCurrencyValue } from "@/lib/formatters";
import type { ArgentinaInstrument, ArgentinaQuote, ArgentinaSourceStatus } from "@/lib/argentina";
import type { ProviderVerificationResult } from "@/lib/providers";

type FundamentalsAuditSnapshot = {
  provider?: string;
  sourceLabel?: string;
  coverageRatio?: number;
  missingFields?: string[];
};

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
  if (provider === "mock") return isSpanish ? "Simulado" : "Mock";
  return provider.replaceAll("_", " ");
}

function argentinaSourceLabel(source: string, isSpanish: boolean) {
  if (source === "manual") return isSpanish ? "Carga manual validada" : "Validated manual load";
  if (source === "mock") return isSpanish ? "Dato estructurado simulado" : "Structured mock data";
  if (source === "byma_future") return isSpanish ? "Integración BYMA futura" : "Future BYMA integration";
  if (source === "cnv_future") return isSpanish ? "CNV futura" : "Future CNV";
  if (source === "broker_future") return isSpanish ? "Broker/API futuro" : "Future broker/API";
  return isSpanish ? "No disponible" : "Unavailable";
}

function formatCoverageNote(note: string, isSpanish: boolean) {
  if (!isSpanish) return note;
  if (note.toLowerCase().includes("provider underlying") || note.toLowerCase().includes("cedear")) {
    return "Subyacente con proveedor / CEDEAR local simulado. Precio local, ratio y CCL implicito son modelados hasta integrar BYMA/IOL o un proveedor licenciado.";
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
      ? "La app usa Yahoo compatible como proveedor real de respaldo antes de recurrir a datos simulados."
      : "The app uses Yahoo-compatible data as a real-data fallback before using mock data.";
  }

  if (verification.actualProvider === "fmp") {
    return isSpanish ? "FMP entregó datos válidos para este endpoint." : "FMP returned valid data for this endpoint.";
  }

  if (verification.actualProvider === "mock") {
    return isSpanish ? "Se utilizó precio simulado de respaldo." : "Mock fallback price was used.";
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
  const auditItems = instrumentUniverse.filter(
    (instrument) =>
      auditSymbols.has(instrument.symbol) ||
      (instrument.symbol === "AAPL" && instrument.category === "cedear"),
  );
  const analysisCoverageItems = instrumentUniverse
    .filter((instrument) => auditSymbols.has(instrument.symbol) || instrument.priority && instrument.priority >= 7)
    .map((instrument) => getAnalysisCoverage(instrument.symbol));
  const analysisSummary = getAnalysisCoverageSummary(analysisCoverageItems);

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
  const cnvStatus = getCnvSourceStatus();
  const latestCnvDocuments = getLatestCnvDocuments(4);

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
              ? "Revisión de cobertura real, proveedor, simulada y futura por instrumento y capa analítica."
              : "Review of real, provider, mock and future coverage by instrument and analytical layer."}
          </p>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">
            {isSpanish
              ? "Esta página existe para evitar confusión entre datos reales, datos de proveedor, datos simulados y cobertura futura."
              : "This page exists to avoid confusion between real data, provider data, mock data and future coverage."}
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
              <p className="mt-2">{isSpanish ? "RSS/proveedor/mock segun disponibilidad" : "RSS/provider/mock depending on availability"}</p>
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
                  <th className="px-4 py-3">Symbol</th>
                  <th className="px-4 py-3">{isSpanish ? "Tipo" : "Type"}</th>
                  <th className="px-4 py-3">{isSpanish ? "Mercado" : "Market"}</th>
                  <th className="px-4 py-3">{isSpanish ? "Tecnico" : "Technical"}</th>
                  <th className="px-4 py-3">{isSpanish ? "Fundamentos" : "Fundamentals"}</th>
                  <th className="px-4 py-3">{isSpanish ? "Renta fija" : "Fixed income"}</th>
                  <th className="px-4 py-3">{isSpanish ? "Grafico" : "Chart"}</th>
                  <th className="px-4 py-3">{isSpanish ? "Notas" : "Notes"}</th>
                </tr>
              </thead>
              <tbody>
                {analysisCoverageItems.map((coverage) => (
                  <tr key={`${coverage.symbol}-${coverage.assetType}`} className="border-b border-white/10 last:border-b-0">
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
              ? "Esta sección separa cargas manuales, datos simulados y rutas futuras BYMA/CNV/broker para evitar confusión sobre qué datos locales son reales."
              : "This section separates manual loads, mock data and future BYMA/CNV/broker paths so local real-data status stays clear."}
          </p>
          <p className="mt-2 text-xs font-medium text-slate-500">manual/mock/future</p>
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
                  <th className="px-3 py-3">Symbol</th>
                  <th className="px-3 py-3">{isSpanish ? "Nombre" : "Name"}</th>
                  <th className="px-3 py-3">{isSpanish ? "Precio" : "Price"}</th>
                  <th className="px-3 py-3">{isSpanish ? "Fuente" : "Source"}</th>
                  <th className="px-3 py-3">{isSpanish ? "Dato real" : "Real data"}</th>
                  <th className="px-3 py-3">{isSpanish ? "Actualizado" : "Updated"}</th>
                  <th className="px-3 py-3">{isSpanish ? "Estado" : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {argentinaAuditItems.map((instrument) => {
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
                        {quote?.source === "manual"
                          ? isSpanish ? "manual/mock/future: manual activo" : "manual/mock/future: manual active"
                          : isSpanish ? "manual/mock/future: respaldo o futuro" : "manual/mock/future: fallback or future"}
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
            {isSpanish ? "Ruta de reemplazo de datos simulados" : "Path to replace simulated data"}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
            {isSpanish
              ? "Acciones USA con relacion CEDEAR usan datos de proveedor o fallback para el subyacente. Los precios locales de CEDEAR, acciones argentinas y bonos quedan etiquetados como carga manual, simulado o futuro hasta integrar BYMA/IOL/PPI o un proveedor licenciado."
              : "USA stocks with a CEDEAR relationship use provider or fallback data for the underlying. Local CEDEAR prices, Argentine equities and bonds stay labeled as manual, mock or future until BYMA/IOL/PPI or a licensed provider is integrated."}
          </p>
        </section>

        <section className="cma-panel cma-card-argentina p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
            {isSpanish ? "CNV source/status" : "CNV source/status"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {isSpanish ? "Auditoria de documentos CNV" : "CNV document audit"}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
            {isSpanish
              ? "La capa CNV separa emisoras registradas, documentos estructurados de demostracion e integracion oficial futura. CNV no se usa para precios en vivo."
              : "The CNV layer separates registered issuers, structured demo documents and future official integration. CNV is not used for live prices."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {cnvStatus.sources.map((source) => (
              <span key={source.source} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                {source.label} | {source.mode}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-300">
            {isSpanish ? "Emisoras registradas" : "Registered issuers"}: {cnvIssuers.map((issuer) => issuer.symbol).join(", ")}
          </p>
          <div className="mt-5">
            <CnvDocumentsPanel documents={latestCnvDocuments} compact />
          </div>
        </section>

        <section className="cma-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[1120px] w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Symbol</th>
                  <th className="px-4 py-3">{isSpanish ? "Nombre" : "Name"}</th>
                  <th className="px-4 py-3">{isSpanish ? "Categoria" : "Category"}</th>
                  <th className="px-4 py-3">{isSpanish ? "Mercado" : "Market"}</th>
                  <th className="px-4 py-3">{isSpanish ? "Cobertura" : "Coverage"}</th>
                  <th className="px-4 py-3">{isSpanish ? "Proveedor efectivo" : "Actual provider"}</th>
                  <th className="px-4 py-3">{isSpanish ? "Reporte" : "Report"}</th>
                  <th className="px-4 py-3">{isSpanish ? "Nota" : "Note"}</th>
                </tr>
              </thead>
              <tbody>
                {auditItems.map((instrument) => {
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
