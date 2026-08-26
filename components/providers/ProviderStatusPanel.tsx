"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/useLanguage";
import type { ProviderStatus } from "@/lib/providers";

function formatProvider(provider: string) {
  return provider.replaceAll("_", " ");
}

function formatProviderDisplay(provider: string, isSpanish: boolean) {
  if (provider === "fmp") return "FMP";
  if (provider === "yahoo") return isSpanish ? "Yahoo compatible" : "Yahoo-compatible";
  if (provider === "google_news_rss") return "Google News RSS";
  if (provider === "alpha_vantage") return "Alpha Vantage";
  return formatProvider(provider);
}

function formatProviderReason(reason: string | undefined, isSpanish: boolean) {
  if (!reason) return isSpanish ? "inactivo" : "disabled";
  if (!isSpanish) return reason.replaceAll("_", " ");
  if (reason === "plan_restricted") return "limitado por plan";
  if (reason.startsWith("Missing ")) return `falta ${reason.replace("Missing ", "")}`;
  return reason.replaceAll("_", " ");
}

export function ProviderStatusPanel() {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const [status, setStatus] = useState<ProviderStatus | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/providers/status");
        if (!active || !response.ok) return;
        setStatus(await response.json());
      } catch {
        if (active) setStatus(null);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const groups = status
    ? [
        { title: isSpanish ? "Precios" : "Market data", active: status.activeMarketDataProvider, items: status.marketData },
        { title: isSpanish ? "Fundamentos" : "Fundamentals", active: status.activeFundamentalsProvider, items: status.fundamentals },
        { title: isSpanish ? "Noticias" : "News", active: status.activeNewsProvider, items: status.news },
      ]
    : [];
  const fmpMarketData = status?.marketData.find((item) => item.provider === "fmp");
  const fmpIsMissing = Boolean(fmpMarketData && !fmpMarketData.enabled);

  return (
    <section className="rounded-lg border border-cyan-300/20 bg-slate-950/55 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
        {isSpanish ? "Estado de proveedores" : "Provider status"}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-white">
        {isSpanish ? "Cadena de datos activa" : "Active data provider chain"}
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        {status
          ? isSpanish
            ? `Proveedor configurado de precios: ${formatProviderDisplay(status.activeMarketDataProvider, true)}. Si ninguna fuente real responde, la app informa N/D y conserva el detalle del error.`
            : `Configured market-data provider: ${formatProviderDisplay(status.activeMarketDataProvider, false)}. If no real source responds, the app reports N/A and preserves the error details.`
          : isSpanish
            ? "Consultando la cadena activa de proveedores."
            : "Checking the active provider chain."}
      </p>

      {fmpIsMissing ? (
        <div className="mt-4 rounded-lg border border-amber-300/25 bg-amber-300/10 p-3 text-sm leading-6 text-amber-50">
          <p className="font-semibold">{isSpanish ? "Accion de despliegue requerida" : "Deployment action required"}</p>
          <p className="mt-1 text-amber-100/90">
            {isSpanish
              ? "Este entorno no tiene FMP_API_KEY disponible. Agrega esa variable en Vercel para Production, Preview y Development y redeploya para que FMP vuelva a ser el proveedor principal."
              : "This environment does not expose FMP_API_KEY. Add that variable in Vercel for Production, Preview and Development, then redeploy so FMP becomes the primary provider again."}
          </p>
        </div>
      ) : null}

      {!status ? (
        <p className="mt-4 text-sm text-slate-500">{isSpanish ? "Cargando estado..." : "Loading status..."}</p>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {groups.map((group) => (
            <div key={group.title} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-white">{group.title}</h3>
                <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-xs text-emerald-100">
                  {isSpanish ? "principal: " : "primary: "}{formatProviderDisplay(group.active, isSpanish)}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {group.items.map((item) => (
                  <div key={`${group.title}-${item.provider}`} className="flex items-start justify-between gap-2 text-xs">
                    <span className="text-slate-300">{formatProviderDisplay(item.provider, isSpanish)}</span>
                    <span className={item.enabled ? "text-emerald-200" : "text-amber-200"}>
                      {item.enabled
                        ? item.provider === group.active
                          ? isSpanish ? "principal" : "primary"
                          : isSpanish ? "respaldo disponible" : "available fallback"
                        : formatProviderReason(item.reason, isSpanish)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
