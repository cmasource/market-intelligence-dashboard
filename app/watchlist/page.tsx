"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { WatchlistPanel } from "@/components/watchlist/WatchlistPanel";
import { useLanguage } from "@/lib/i18n/useLanguage";

export default function WatchlistPage() {
  const { language } = useLanguage();

  return (
    <AppShell>
      <div className="space-y-6 py-6">
        <section className="cma-panel-elevated p-6">
          <p className="cma-kicker">{language === "es" ? "Seguimiento de mercado" : "Market tracking"}</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-white">{language === "es" ? "Mis listas" : "My watchlists"}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                {language === "es"
                  ? "Organizá activos en múltiples listas. Si iniciás sesión, tus listas quedan asociadas a tu cuenta; sin sesión, permanecen sólo en este navegador. No representan posiciones, operaciones ni rendimiento."
                  : "Organize assets in multiple lists. When signed in, your lists belong to your account; without a session, they remain only in this browser. They do not represent positions, trades, or performance."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/trade-radar" className="inline-flex min-h-11 items-center rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100">
                {language === "es" ? "Ir a Trade Radar" : "Open Trade Radar"}
              </Link>
              <Link href="/screener" className="inline-flex min-h-11 items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300">
                {language === "es" ? "Explorar activos" : "Explore assets"}
              </Link>
            </div>
          </div>
        </section>
        <WatchlistPanel />
      </div>
    </AppShell>
  );
}
