"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { WatchlistPanel } from "@/components/watchlist/WatchlistPanel";
import { useLanguage } from "@/lib/i18n/useLanguage";

export default function WatchlistPage() {
  const { language } = useLanguage();

  return (
    <AppShell>
      <div className="space-y-8 py-6">
        <section className="cma-panel-elevated p-6">
          <p className="cma-kicker">{language === "es" ? "Lista local" : "Local watchlist"}</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-white">{language === "es" ? "Mi lista" : "Watchlist"}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                {language === "es"
                  ? "Lista local guardada en este navegador. No requiere cuenta y no se sincroniza entre dispositivos."
                  : "A local list saved in this browser. It does not require an account and does not sync across devices."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/screener" className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100">
                {language === "es" ? "Ir al screener" : "Open screener"}
              </Link>
              <Link href="/markets#market-heatmap" className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300">
                {language === "es" ? "Ver heatmap" : "View heatmap"}
              </Link>
              <Link href="/argentina" className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300">
                {language === "es" ? "Ver Argentina" : "View Argentina"}
              </Link>
            </div>
          </div>
        </section>
        <WatchlistPanel />
      </div>
    </AppShell>
  );
}
