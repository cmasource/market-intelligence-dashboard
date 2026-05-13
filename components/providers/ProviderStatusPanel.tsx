"use client";

import { useEffect, useState } from "react";
import type { ProviderStatus } from "@/lib/providers";
import { useLanguage } from "@/lib/i18n/useLanguage";

function formatProvider(provider: string) {
  return provider.replaceAll("_", " ");
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

  return (
    <section className="rounded-lg border border-cyan-300/20 bg-slate-950/55 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
        {isSpanish ? "Estado de proveedores" : "Provider status"}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-white">
        {isSpanish ? "Cadena de datos activa" : "Active data provider chain"}
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        {isSpanish
          ? "Las claves faltantes deshabilitan proveedores reales y la app vuelve a Yahoo, RSS o datos simulados sin romper la demo."
          : "Missing keys disable real providers and the app falls back to Yahoo, RSS or mock data without breaking the demo."}
      </p>

      {!status ? (
        <p className="mt-4 text-sm text-slate-500">{isSpanish ? "Cargando estado..." : "Loading status..."}</p>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {groups.map((group) => (
            <div key={group.title} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-white">{group.title}</h3>
                <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-xs text-emerald-100">
                  {formatProvider(group.active)}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {group.items.map((item) => (
                  <div key={`${group.title}-${item.provider}`} className="flex items-start justify-between gap-2 text-xs">
                    <span className="capitalize text-slate-300">{formatProvider(item.provider)}</span>
                    <span className={item.enabled ? "text-emerald-200" : "text-amber-200"}>
                      {item.enabled ? (isSpanish ? "activo" : "enabled") : item.reason ?? (isSpanish ? "inactivo" : "disabled")}
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
