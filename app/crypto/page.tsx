"use client";

import { AppShell } from "@/components/layout/AppShell";
import { CryptoWorkspace } from "@/components/market/CryptoWorkspace";
import { useLanguage } from "@/lib/i18n/useLanguage";

export default function CryptoPage() {
  const { language } = useLanguage();
  const isSpanish = language === "es";

  return (
    <AppShell>
      <div className="space-y-8 py-6">
        <section className="rounded-lg border border-cyan-300/20 bg-slate-900/70 p-6 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
            {isSpanish ? "Cripto" : "Crypto"}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            {isSpanish ? "Monitor cripto" : "Crypto Monitor"}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            {isSpanish
              ? "Cotizaciones, variaciones e indicadores tecnicos para comparar los principales criptoactivos."
              : "Quotes, changes, and technical indicators for comparing leading crypto assets."}
          </p>
        </section>
        <CryptoWorkspace />
      </div>
    </AppShell>
  );
}
