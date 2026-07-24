"use client";

import { formatCurrency, formatNumber, formatPercent } from "@/lib/formatters";
import type { ArgentinaQuote } from "@/lib/argentina";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { Badge } from "../ui/Badge";
import { MetricGrid } from "../ui/MetricGrid";
import { SectionHeader } from "../ui/SectionHeader";
import { useAssetQuote } from "./AssetQuoteProvider";

export function BondMetricsCard() {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const { quote: sharedQuote, loading } = useAssetQuote();
  const quote = sharedQuote as ArgentinaQuote | null;

  const hasRealQuote = Boolean(quote?.isRealData && typeof quote.price === "number");
  const currency = quote?.currency ?? "ARS";
  const unavailable = isSpanish ? "No disponible" : "Unavailable";
  const value = (amount: number | null | undefined) =>
    typeof amount === "number" && Number.isFinite(amount)
      ? formatCurrency(amount, currency, language)
      : unavailable;
  const rows = [
    { label: isSpanish ? "Ultimo precio" : "Last price", value: value(quote?.price) },
    { label: "Bid", value: value(quote?.bid) },
    { label: "Ask", value: value(quote?.ask) },
    {
      label: isSpanish ? "Variacion" : "Change",
      value: typeof quote?.changePercent === "number" ? formatPercent(quote.changePercent) : unavailable,
    },
    {
      label: isSpanish ? "Volumen" : "Volume",
      value: typeof quote?.volume === "number" ? formatNumber(quote.volume) : unavailable,
    },
    {
      label: isSpanish ? "Actualizacion" : "Updated",
      value: quote?.lastUpdated ? new Intl.DateTimeFormat(isSpanish ? "es-AR" : "en-US", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(quote.lastUpdated)) : unavailable,
    },
  ];

  return (
    <section className="cma-panel p-5" data-testid="bond-market-quote">
      <SectionHeader
        eyebrow={isSpanish ? "Renta fija argentina" : "Argentine fixed income"}
        title={isSpanish ? "Cotizacion de mercado" : "Market quote"}
        description={
          isSpanish
            ? "La pantalla publica solamente precios recibidos de una fuente de mercado configurada."
            : "The public screen only displays prices received from a configured market source."
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone={hasRealQuote ? "positive" : "warning"}>
          {loading ? (isSpanish ? "Actualizando" : "Refreshing") : hasRealQuote ? (isSpanish ? "Cotizacion disponible" : "Quote available") : unavailable}
        </Badge>
      </div>
      <MetricGrid items={rows} />
      <p className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">
        {isSpanish
          ? "TIR, paridad, duration y convexidad se publicaran cuando los terminos y calendarios oficiales del bono esten integrados y validados."
          : "YTM, parity, duration and convexity will be published after official bond terms and cash-flow schedules are integrated and validated. Simulated estimates are not shown."}
      </p>
    </section>
  );
}
