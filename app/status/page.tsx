"use client";

import { AppShell } from "@/components/layout/AppShell";
import { DataCoverageLegend } from "@/components/data-coverage/DataCoverageLegend";
import { ProviderStatusPanel } from "@/components/providers/ProviderStatusPanel";
import { useLanguage } from "@/lib/i18n/useLanguage";
import Link from "next/link";

const implemented = [
  "MVP dashboard",
  "CMA Consulting / cma_source branding",
  "EN/ES i18n",
  "Financial engine",
  "Financial engine validation",
  "Interactive charts",
  "Market data provider layer",
  "Real USA/crypto market data with fallback",
  "Technical analysis from OHLCV",
  "Fundamentals USA with fallback",
  "Fixed income analytics mock module",
  "CEDEAR ratio and implied CCL mock analytics",
  "News MVP with provider/RSS/mock fallback",
  "Expanded USA/crypto provider coverage with fallback",
  "Data audit page",
  "Methodology page",
  "Playwright smoke tests",
];

const pending = [
  "Real Argentina market data",
  "BYMA/IOL/CNV integration",
  "Real bond terms and calendars",
  "Screener",
  "Watchlist",
  "Portfolio",
  "Alerts",
  "AI agents",
  "PDF reports",
  "Arbitrage intelligence",
  "Backtesting",
  "User accounts",
  "Database/cache",
];

const demoReady = [
  "Dashboard",
  "Search",
  "Markets",
  "Screener",
  "USA/crypto charts",
  "Technical analysis",
  "Fixed income mock analytics",
  "Data coverage transparency",
  "Data audit",
  "Methodology",
];

const demoPending = [
  "Real Argentina market data",
  "CNV/BYMA/IOL integrations",
  "CEDEAR ratios and implied CCL",
  "Licensed real news provider configuration",
  "User accounts and watchlists",
];

export default function StatusPage() {
  const { language } = useLanguage();
  const isSpanish = language === "es";

  return (
    <AppShell>
      <div className="space-y-8 py-6">
        <section className="rounded-lg border border-cyan-300/20 bg-slate-900/70 p-6 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
            CMA Market Intelligence
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            {isSpanish ? "Estado del desarrollo" : "Development Status"}
          </h1>
        </section>
        <DataCoverageLegend />
        <ProviderStatusPanel />
        <section className="rounded-lg border border-indigo-300/20 bg-indigo-300/10 p-5">
          <h2 className="text-xl font-semibold text-white">
            {isSpanish ? "Demo publica" : "Public demo"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {isSpanish
              ? "Demo publica - datos reales, proveedor, simulados y cobertura futura."
              : "Public demo - real, provider, mock and future coverage."}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {isSpanish
              ? "Demo en evolucion. Las sugerencias y el feedback se usaran para priorizar proximas mejoras."
              : "Demo in progress. Feedback will be used to prioritize upcoming improvements."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/data-audit"
              className="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-300/15"
            >
              {isSpanish ? "Ver auditoria de datos" : "View data audit"}
            </Link>
            <Link
              href="/methodology"
              className="rounded-md border border-violet-300/30 bg-violet-300/10 px-4 py-2 text-sm font-semibold text-violet-100 transition hover:border-violet-200 hover:bg-violet-300/15"
            >
              {isSpanish ? "Ver metodologia" : "View methodology"}
            </Link>
          </div>
        </section>
        <section className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-5">
          <h2 className="text-xl font-semibold text-white">
            {isSpanish ? "Estado para demo publica" : "Public demo readiness"}
          </h2>
          <div className="mt-4 grid gap-5 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
                {isSpanish ? "Listo" : "Ready"}
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                {demoReady.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">
                {isSpanish ? "Pendiente" : "Pending"}
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                {demoPending.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-5">
            <h2 className="text-xl font-semibold text-white">{isSpanish ? "Implementado" : "Implemented"}</h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
              {implemented.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-5">
            <h2 className="text-xl font-semibold text-white">{isSpanish ? "Pendiente" : "Pending"}</h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
              {pending.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
