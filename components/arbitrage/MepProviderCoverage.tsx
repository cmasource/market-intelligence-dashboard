import { CheckCircle2, Clock3, ExternalLink, Info, Radio } from "lucide-react";
import type { FxProvider, ProductOperatingWindow, ProductQuoteAccess } from "@/lib/arbitrage/types";
import type { Language } from "@/lib/i18n/types";
import { ProviderLogo } from "./ProviderLogo";

type Props = {
  providers: FxProvider[];
  language: Language;
};

function accessLabel(access: ProductQuoteAccess, language: Language) {
  if (access === "aggregated_public") return language === "es" ? "Referencia pública agregada" : "Public aggregated reference";
  if (access === "direct_public") return language === "es" ? "Cotización pública directa" : "Direct public quote";
  return language === "es" ? "Precio disponible dentro de la app" : "Price available inside the app";
}

function scheduleLabel(window: ProductOperatingWindow, language: Language) {
  if (window === "24x7") return language === "es" ? "Producto anunciado 24/7" : "Product advertised 24/7";
  if (window === "market_hours") return language === "es" ? "Opera en horario de mercado" : "Operates during market hours";
  return language === "es" ? "Horario no publicado en la fuente revisada" : "Schedule not published in the reviewed source";
}

export function MepProviderCoverage({ providers, language }: Props) {
  const mepProviders = providers.filter((provider) => provider.usdProducts?.mep?.status === "documented");

  return (
    <section className="rounded-xl border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] p-4 sm:p-5" data-testid="mep-provider-coverage">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-200"><Radio size={17} aria-hidden="true" /></span>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--cma-text-muted)]">{language === "es" ? "Cobertura de productos MEP" : "MEP product coverage"}</h2>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--cma-text-muted)]">
            {language === "es"
              ? "La disponibilidad del producto se valida con documentación de cada entidad. Una plataforma puede ofrecer MEP aunque no publique una cotización abierta para integrarla."
              : "Product availability is checked against each provider's documentation. A platform may offer MEP without exposing a public quote that can be integrated."}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {mepProviders.map((provider) => {
          const mep = provider.usdProducts!.mep!;
          const official = provider.usdProducts?.official?.status === "documented";
          return (
            <article key={provider.id} className="rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] p-3">
              <div className="flex items-center gap-3">
                <ProviderLogo providerId={provider.id} providerName={provider.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-xs font-semibold text-[var(--cma-text-primary)]">{provider.name}</h3>
                  <p className="mt-0.5 text-[10px] text-emerald-300"><CheckCircle2 size={11} aria-hidden="true" className="mr-1 inline" />{language === "es" ? "Dólar MEP documentado" : "Documented MEP product"}</p>
                </div>
              </div>
              <dl className="mt-3 space-y-2 text-[10px] leading-4 text-[var(--cma-text-secondary)]">
                <div className="flex gap-2"><dt className="shrink-0 text-[var(--cma-text-muted)]">{language === "es" ? "Dólar oficial:" : "Official USD:"}</dt><dd>{official ? (language === "es" ? "También disponible" : "Also available") : (language === "es" ? "No documentado por la entidad" : "Not documented by provider")}</dd></div>
                <div className="flex gap-2"><Info size={11} aria-hidden="true" className="mt-0.5 shrink-0 text-sky-300" /><dd>{accessLabel(mep.quoteAccess, language)}</dd></div>
                <div className="flex gap-2"><Clock3 size={11} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--cma-text-muted)]" /><dd>{scheduleLabel(mep.operatingWindow, language)}</dd></div>
              </dl>
              <a href={mep.documentationUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-8 items-center gap-1 text-[10px] font-semibold text-[var(--cma-accent-cyan)] hover:underline"><ExternalLink size={11} aria-hidden="true" />{language === "es" ? "Ver fuente oficial" : "Open official source"}</a>
            </article>
          );
        })}
      </div>
    </section>
  );
}
