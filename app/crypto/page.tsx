"use client";

import { CryptoMonitor } from "@/components/dashboard/CryptoMonitor";
import { AppShell } from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { CRYPTO_INSTRUMENT_UNIVERSE } from "@/lib/instrument-universe";
import { sectionAccents } from "@/lib/ui/section-accents";

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
              ? "Seguimiento de BTC-USD, ETH-USD y referencias futuras para dolar cripto, stablecoins e inteligencia de arbitrajes."
              : "Monitoring for BTC-USD, ETH-USD and future references for crypto dollar, stablecoins and arbitrage intelligence."}
          </p>
        </section>
        <CryptoMonitor />
        <p className={`rounded-lg border p-4 text-sm text-slate-300 ${sectionAccents.crypto.card}`}>
          {isSpanish
            ? "Modulo futuro: dolar cripto, stablecoins e inteligencia de arbitrajes."
            : "Future module: crypto dollar, stablecoins and arbitrage intelligence."}
        </p>
        <section className={`rounded-lg border bg-slate-950/55 p-5 backdrop-blur ${sectionAccents.crypto.card}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
            {isSpanish ? "Hoja de ruta del universo cripto" : "Crypto universe roadmap"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {isSpanish ? "De BTC y ETH a las 50 principales" : "From BTC and ETH to the top 50 crypto assets"}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            {isSpanish
              ? "Soporte actual con datos reales o fallback: BTC-USD y ETH-USD. La expansion futura apunta a los 50 principales criptoactivos, stablecoins, dolar cripto e inteligencia de arbitrajes."
              : "Current live/fallback support: BTC-USD and ETH-USD. Future expansion targets the top 50 crypto assets, stablecoins, crypto dollar monitoring and arbitrage intelligence."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {CRYPTO_INSTRUMENT_UNIVERSE.map((instrument) => (
              <span
                key={instrument.symbol}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-slate-300"
              >
                {instrument.symbol}
              </span>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
