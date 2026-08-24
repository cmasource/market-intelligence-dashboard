import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, ExternalLink, ShieldCheck } from "lucide-react";
import type { FxProvider, UsdCryptoCircuit } from "@/lib/arbitrage/types";
import { formatArs, formatTimestamp } from "./format";

function freshnessLabel(status: UsdCryptoCircuit["freshnessStatus"], language: "es" | "en") {
  if (status === "fresh") return language === "es" ? "Cotización reciente" : "Recent quote";
  if (status === "warning") return language === "es" ? "Revisar antigüedad" : "Check quote age";
  if (status === "stale") return language === "es" ? "Cotización vencida" : "Stale quote";
  return language === "es" ? "Hora de origen no verificable" : "Source time unavailable";
}

export function UsdCryptoCircuitMonitor({
  circuits,
  providers,
  language,
}: {
  circuits: UsdCryptoCircuit[];
  providers: Map<string, FxProvider>;
  language: "es" | "en";
}) {
  return (
    <section className="rounded-xl border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)]" data-testid="usd-crypto-circuit-monitor">
      <div className="flex flex-col gap-3 border-b border-[var(--cma-border-soft)] p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div>
          <p className="cma-kicker">{language === "es" ? "Circuitos entre plataformas" : "Cross-platform routes"}</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--cma-text-primary)]">{language === "es" ? "USD bancario → stablecoin → pesos" : "Bank USD → stablecoin → pesos"}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--cma-text-secondary)]">
            {language === "es"
              ? "Compara la compra de USD en una entidad con su transferencia a una billetera que documenta la conversión a stablecoin y la venta posterior en pesos."
              : "Compares a bank USD purchase with a transfer to a wallet that documents stablecoin conversion and the subsequent sale into pesos."}
          </p>
        </div>
        <div className="inline-flex shrink-0 items-center gap-2 text-xs text-[var(--cma-text-muted)]">
          <Clock3 size={15} aria-hidden="true" />
          {language === "es" ? "Se actualiza cada 60 s" : "Refreshes every 60s"}
        </div>
      </div>

      {circuits.length ? (
        <div className="grid gap-px bg-[var(--cma-border-soft)] lg:grid-cols-2">
          {circuits.map((circuit) => {
            const source = providers.get(circuit.sourceProviderId)?.name ?? circuit.sourceProviderId;
            const destination = providers.get(circuit.destinationProviderId)?.name ?? circuit.destinationProviderId;
            const effective = circuit.status === "effective_quote";
            return (
              <article key={circuit.id} className="min-w-0 bg-[var(--cma-bg-panel)] p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--cma-text-muted)]">{circuit.mode === "automatic" ? (language === "es" ? "Conversión automática" : "Automatic conversion") : (language === "es" ? "Circuito manual" : "Manual route")}</p>
                    <h3 className="mt-1 text-lg font-semibold text-[var(--cma-text-primary)]">{source} <ArrowRight className="inline" size={15} aria-hidden="true" /> {destination}</h3>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${effective ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-amber-400/30 bg-amber-400/10 text-amber-200"}`}>
                    {effective ? <CheckCircle2 size={13} aria-hidden="true" /> : <AlertTriangle size={13} aria-hidden="true" />}
                    {effective ? (language === "es" ? "Precio compuesto disponible" : "Composite quote available") : (language === "es" ? "Falta spread de conversión" : "Conversion spread missing")}
                  </span>
                </div>

                <ol className="mt-5 grid gap-2 text-xs sm:grid-cols-3">
                  <li className="min-w-0 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] p-3"><span className="block text-[var(--cma-text-muted)]">1. {language === "es" ? "Comprar USD" : "Buy USD"}</span><strong className="mt-1 block break-words text-[var(--cma-text-primary)]">{formatArs(circuit.usdBuyRateArs, language)}</strong></li>
                  <li className="min-w-0 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] p-3"><span className="block text-[var(--cma-text-muted)]">2. USD → {circuit.stablecoin}</span><strong className="mt-1 block break-words text-[var(--cma-text-primary)]">{effective ? (language === "es" ? "Incluido en la punta" : "Included in quote") : (language === "es" ? "Visible solo en app" : "App-only rate")}</strong></li>
                  <li className="min-w-0 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] p-3"><span className="block text-[var(--cma-text-muted)]">3. {circuit.stablecoin} → ARS</span><strong className="mt-1 block break-words text-[var(--cma-text-primary)]">{formatArs(circuit.stablecoinSellRateArs, language)}</strong></li>
                </ol>

                <div className="mt-4 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] p-3">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.1em] text-[var(--cma-text-muted)]">{effective ? (language === "es" ? "Diferencia bruta por USD" : "Gross difference per USD") : (language === "es" ? "Techo teórico antes del spread" : "Theoretical ceiling before spread")}</p>
                      <p className={`mt-1 text-xl font-semibold ${circuit.grossSpreadUpperBoundArsPerUsd > 0 ? "text-emerald-300" : "text-rose-300"}`}>{formatArs(circuit.grossSpreadUpperBoundArsPerUsd, language)}</p>
                    </div>
                    <p className="text-right text-xs leading-5 text-[var(--cma-text-muted)]">{freshnessLabel(circuit.freshnessStatus, language)}<br />{formatTimestamp(circuit.observedAt ?? circuit.fetchedAt, language)}</p>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[var(--cma-text-secondary)]">
                    {effective
                      ? (language === "es" ? "La punta contempla la doble conversión, pero faltan costos, límites y precio final para calcular ganancia neta." : "The quote includes the double conversion, but costs, limits, and the final executable price are still needed for net profit.")
                      : (language === "es" ? "No es una rentabilidad: supone temporalmente 1 USD = 1 USDt. El spread real informado por Lemon debe descontarse antes de evaluar el circuito." : "This is not a return: it temporarily assumes USD 1 = USDt 1. Lemon's actual in-app spread must be deducted first.")}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-[var(--cma-text-secondary)]"><ShieldCheck size={14} aria-hidden="true" />{language === "es" ? "Solo cuentas del mismo titular" : "Same-holder accounts only"}</span>
                  <a href={circuit.providerDocumentationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-[var(--cma-accent-cyan)] hover:underline">{language === "es" ? "Cómo funciona" : "How it works"}<ExternalLink size={13} aria-hidden="true" /></a>
                  {circuit.destinationQuoteUrl ? <a href={circuit.destinationQuoteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-[var(--cma-accent-cyan)] hover:underline">{language === "es" ? "Fuente de cotización" : "Quote source"}<ExternalLink size={13} aria-hidden="true" /></a> : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="p-6 text-sm text-[var(--cma-text-muted)]">{language === "es" ? "No hay dos puntas recientes suficientes para evaluar estos circuitos." : "There are not enough recent quotes to evaluate these routes."}</div>
      )}

      <div className="flex gap-3 border-t border-amber-400/20 bg-amber-400/10 p-4 text-xs leading-5 text-amber-100">
        <ShieldCheck size={17} aria-hidden="true" className="mt-0.5 shrink-0" />
        <p>{language === "es" ? "CMA no certifica la elegibilidad legal o regulatoria de una operación. Antes de operar, verificá las declaraciones juradas, restricciones vigentes, términos del proveedor, límites, tiempos y precio final aplicables a tu situación." : "CMA does not certify the legal or regulatory eligibility of a transaction. Before trading, verify current declarations, restrictions, provider terms, limits, settlement times, and final price for your situation."}</p>
      </div>
    </section>
  );
}
