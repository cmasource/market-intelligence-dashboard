"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DataCoverageLegend } from "@/components/data-coverage/DataCoverageLegend";
import { ProviderStatusPanel } from "@/components/providers/ProviderStatusPanel";
import { useLanguage } from "@/lib/i18n/useLanguage";
import Link from "next/link";

const implemented = [
  "MVP dashboard",
  "CMA Consulting brand identity",
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
  "News MVP with provider/RSS sources and unavailable state",
  "Expanded USA/crypto provider coverage with fallback",
  "CNV issuer registry and structured document placeholders",
  "Data audit page",
  "Methodology page",
  "Screener",
  "Local browser watchlist",
  "Supabase Auth foundation and private account route",
  "Playwright smoke tests",
];

const pending = [
  "Real Argentina market data",
  "BYMA/IOL/CNV integration",
  "Official CNV document integration",
  "Real bond terms and calendars",
  "Portfolio",
  "Alerts",
  "AI agents",
  "PDF reports",
  "Arbitrage intelligence",
  "Backtesting",
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
  "Local watchlist",
];

const demoPending = [
  "Real Argentina market data",
  "CNV/BYMA/IOL integrations",
  "CEDEAR ratios and implied CCL",
  "Licensed real news provider configuration",
  "Account-synced watchlists",
];

type RuntimeDiagnostics = {
  nodeEnvironment?: string;
  vercelEnvironment?: string;
  configuredMarketProvider?: string;
  configuredNewsProvider?: string;
  configuredFundamentalsProvider?: string;
  activeMarketDataProvider?: string;
  activeFundamentalsProvider?: string;
  activeNewsProvider?: string;
  providerFlags?: {
    fmpKeyPresent?: boolean;
    logoDevTokenPresent?: boolean;
    yahooFallbackEnabled?: boolean;
    mockFallbackEnabled?: boolean;
  };
};

function DeploymentParityPanel({ isSpanish }: { isSpanish: boolean }) {
  const [diagnostics, setDiagnostics] = useState<RuntimeDiagnostics | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/diagnostics/runtime")
      .then((response) => response.json())
      .then((data: RuntimeDiagnostics) => {
        if (active) setDiagnostics(data);
      })
      .catch(() => {
        if (active) setDiagnostics(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const flags = diagnostics?.providerFlags;
  const pendingValue = isSpanish ? "Verificando..." : "Checking...";
  const booleanValue = (value: boolean | undefined) => {
    if (!diagnostics || value === undefined) return pendingValue;
    return value ? "yes" : "no";
  };
  const fallbackValue = () => {
    if (!diagnostics || !flags) return pendingValue;
    return flags.yahooFallbackEnabled || flags.mockFallbackEnabled ? "enabled" : "disabled";
  };

  return (
    <section className="cma-panel cma-glow-violet p-5" data-testid="deployment-parity-panel">
      <p className="cma-kicker">{isSpanish ? "Produccion" : "Production"}</p>
      <h2 className="mt-2 text-xl font-semibold text-white">
        {isSpanish ? "Paridad local/producción" : "Local/production parity"}
      </h2>
      <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
        {isSpanish
          ? "Si faltan variables de entorno en Vercel, produccion puede informar N/D aunque local use proveedores configurados. Configura las variables y redeploya para igualar comportamiento."
          : "If Vercel environment variables are missing, production can use fallback, mock or manual data even when local uses configured providers. Configure variables and redeploy to match behavior."}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["NODE_ENV", diagnostics?.nodeEnvironment ?? pendingValue],
          ["Vercel", diagnostics?.vercelEnvironment ?? pendingValue],
          [isSpanish ? "Mercado" : "Market", diagnostics?.configuredMarketProvider ?? pendingValue],
          [isSpanish ? "Noticias" : "News", diagnostics?.configuredNewsProvider ?? pendingValue],
          [isSpanish ? "Fundamentos" : "Fundamentals", diagnostics?.configuredFundamentalsProvider ?? pendingValue],
          ["FMP key", booleanValue(flags?.fmpKeyPresent)],
          ["Logo.dev", booleanValue(flags?.logoDevTokenPresent)],
          [isSpanish ? "Fallback" : "Fallback", fallbackValue()],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-white/10 bg-white/[0.035] p-3"
            data-diagnostic-label={label}
          >
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
            <p className="mt-2 text-sm font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function StatusPage() {
  const { language } = useLanguage();
  const isSpanish = language === "es";

  return (
    <AppShell>
      <div className="space-y-8 py-6">
        <section className="cma-panel-elevated cma-glow-cyan p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
            CMA Market Intelligence
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            {isSpanish ? "Estado del desarrollo" : "Development Status"}
          </h1>
        </section>
        <DataCoverageLegend />
        <ProviderStatusPanel />
        <DeploymentParityPanel isSpanish={isSpanish} />
        <section className="cma-panel cma-card-analysis p-5">
          <h2 className="text-xl font-semibold text-white">
            {isSpanish ? "Demo publica" : "Public demo"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {isSpanish
              ? "Demo publica - proveedores reales, cobertura efectiva y estados no disponibles."
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
        <section className="cma-panel cma-card-price p-5">
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
          <section className="cma-card-argentina p-5">
            <h2 className="text-xl font-semibold text-white">{isSpanish ? "Implementado" : "Implemented"}</h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
              {implemented.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </section>
          <section className="cma-card-risk p-5">
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
