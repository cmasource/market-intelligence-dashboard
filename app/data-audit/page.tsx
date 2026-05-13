"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DataCoverageBadges } from "@/components/data-coverage/DataCoverageBadges";
import { ProviderStatusPanel } from "@/components/providers/ProviderStatusPanel";
import { getInstrumentContextCoverage, getCoverageStatusLabel } from "@/lib/data-coverage";
import { instrumentUniverse } from "@/lib/instrument-universe/universe";
import { useLanguage } from "@/lib/i18n/useLanguage";
import type { ProviderVerificationResult } from "@/lib/providers";

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

function formatCategory(category: string) {
  return category.replaceAll("_", " ");
}

function formatProviderName(provider: string, isSpanish: boolean) {
  if (provider === "fmp") return "FMP";
  if (provider === "yahoo") return isSpanish ? "Yahoo compatible" : "Yahoo-compatible";
  if (provider === "mock") return isSpanish ? "Simulado" : "Mock";
  return provider.replaceAll("_", " ");
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
  const auditItems = instrumentUniverse.filter(
    (instrument) =>
      auditSymbols.has(instrument.symbol) ||
      (instrument.symbol === "AAPL" && instrument.category === "cedear"),
  );

  return (
    <AppShell>
      <div className="space-y-8 py-6">
        <section className="rounded-lg border border-cyan-300/20 bg-slate-900/70 p-6 backdrop-blur">
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

        <section className="overflow-hidden rounded-lg border border-white/10 bg-slate-950/55">
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
                      <td className="px-4 py-4 text-xs leading-5 text-slate-400">{note}</td>
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
