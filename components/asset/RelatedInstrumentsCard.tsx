"use client";

import {
  getPrimaryInstrument,
  getRelatedInstruments,
  hasRelatedInstruments,
} from "@/lib/instrument-universe";
import { formatDisplayCurrency } from "@/lib/formatters";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { getAssetHref } from "@/lib/instruments/assetHref";

type RelatedInstrumentsCardProps = {
  symbol: string;
  instrumentId?: string;
};

export function RelatedInstrumentsCard({ symbol, instrumentId }: RelatedInstrumentsCardProps) {
  const { language } = useLanguage();
  const relatedInstruments = getRelatedInstruments(symbol, instrumentId);
  const primaryInstrument = getPrimaryInstrument(symbol, instrumentId);
  const primaryHref =
    primaryInstrument && primaryInstrument.instrumentId !== instrumentId
      ? getAssetHref(primaryInstrument.symbol, primaryInstrument.instrumentId)
      : null;

  if (!hasRelatedInstruments(symbol, instrumentId)) return null;

  const isSpanish = language === "es";

  return (
    <section className="rounded-lg border border-cyan-300/20 bg-cyan-400/[0.07] p-4 backdrop-blur">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
            {isSpanish ? "Mercados disponibles" : "Available markets"}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {isSpanish ? "Accion local y ADR" : "Local share and ADR"}
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
            {isSpanish
              ? "Cada especie conserva su mercado, moneda, cotizacion y analisis tecnico. Los fundamentos de la especie local pueden tomar como base el ADR asociado."
              : "Each listing keeps its own market, currency, quote and technical analysis. Local-share fundamentals may use the related ADR as their basis."}
          </p>
        </div>
        {primaryInstrument && primaryHref ? (
          <a
            href={primaryHref}
            data-testid="related-primary-instrument-link"
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
          >
            {isSpanish ? "Instrumento principal" : "Primary instrument"}: {primaryInstrument.symbol}
          </a>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {relatedInstruments.map((instrument) => {
          const isCurrent = instrument.instrumentId === instrumentId;
          const label = language === "es" ? instrument.labelEs : instrument.labelEn;
          const className = isCurrent
            ? "rounded-lg border border-cyan-200/60 bg-cyan-300/15 px-4 py-3 text-sm shadow-lg shadow-cyan-950/20"
            : "rounded-lg border border-white/10 bg-slate-950/45 px-4 py-3 text-sm transition hover:border-cyan-300/40 hover:bg-cyan-300/10";
          const content = (
            <>
              <span className="block font-semibold text-white">{instrument.symbol}</span>
              <span className="mt-1 block text-xs text-slate-300">{label}</span>
              <span className="mt-1 block text-xs text-slate-500">
                {formatDisplayCurrency(instrument.currency, language)} | {instrument.market}
              </span>
            </>
          );

          if (isCurrent) {
            return (
              <div key={instrument.instrumentId} aria-current="page" className={className}>
                {content}
              </div>
            );
          }

          return (
            <a key={instrument.instrumentId} href={instrument.href} className={className}>
              {content}
            </a>
          );
        })}
      </div>
    </section>
  );
}
