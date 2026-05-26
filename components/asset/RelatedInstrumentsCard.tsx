"use client";

import {
  getPrimaryInstrument,
  getRelatedInstruments,
  hasRelatedInstruments,
} from "@/lib/instrument-universe";
import { formatDisplayCurrency } from "@/lib/formatters";
import { useLanguage } from "@/lib/i18n/useLanguage";

type RelatedInstrumentsCardProps = {
  symbol: string;
};

export function RelatedInstrumentsCard({ symbol }: RelatedInstrumentsCardProps) {
  const { language } = useLanguage();
  const relatedInstruments = getRelatedInstruments(symbol);
  const primaryInstrument = getPrimaryInstrument(symbol);
  const normalizedSymbol = symbol.toUpperCase();
  const primaryHref =
    primaryInstrument && primaryInstrument.symbol !== normalizedSymbol
      ? `/asset/${encodeURIComponent(primaryInstrument.symbol)}`
      : null;

  if (!hasRelatedInstruments(symbol)) return null;

  const isSpanish = language === "es";

  return (
    <section className="rounded-lg border border-cyan-300/20 bg-cyan-400/10 p-5 backdrop-blur">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
            {isSpanish ? "Instrumentos relacionados" : "Related instruments"}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {isSpanish ? "Especies y simbolos vinculados" : "Linked symbols and trading species"}
          </h2>
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
          const isCurrent = instrument.symbol === normalizedSymbol;
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
              {instrument.isPrimary ? (
                <span className="mt-2 inline-flex rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-0.5 text-xs text-emerald-100">
                  {isSpanish ? "Principal" : "Primary"}
                </span>
              ) : null}
            </>
          );

          if (isCurrent) {
            return (
              <div key={instrument.symbol} aria-current="page" className={className}>
                {content}
              </div>
            );
          }

          return (
            <a key={instrument.symbol} href={instrument.href} className={className}>
              {content}
            </a>
          );
        })}
      </div>
    </section>
  );
}
