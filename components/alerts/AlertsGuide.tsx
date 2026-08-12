"use client";

import Link from "next/link";
import { Activity, ArrowLeft, BellRing, BookOpen, Calculator, Gauge, Info, Settings2, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n/useLanguage";

type GuideItem = {
  name: string;
  trigger: string;
  meaning: string;
  caveat: string;
};

const automaticRules: Record<"es" | "en", GuideItem[]> = {
  es: [
    {
      name: "Movimiento de precio inusual",
      trigger: "La última variación supera el mayor de estos dos límites: 2,5 veces la volatilidad reciente o 1,5 veces el ATR14 expresado como porcentaje.",
      meaning: "Detecta una suba o baja excepcional para el comportamiento reciente de ese mismo activo.",
      caveat: "No usa un porcentaje universal y no indica que el movimiento vaya a continuar.",
    },
    {
      name: "Volumen inusual",
      trigger: "El volumen de la última barra completa es al menos 2,2 veces el promedio de las 20 barras anteriores, con suficiente volumen válido.",
      meaning: "Señala una participación de mercado muy superior a la habitual.",
      caveat: "Más volumen confirma interés, pero no define por sí solo la dirección ni la calidad del movimiento.",
    },
    {
      name: "Cambio de tendencia",
      trigger: "El cierre cruza la EMA50 o rompe el máximo/mínimo de las 20 barras anteriores, con un margen de 0,15 ATR14 para evitar roces mínimos.",
      meaning: "Marca una recuperación alcista o una ruptura bajista de un nivel técnico relevante.",
      caveat: "Es una señal técnica informativa; puede producir falsas rupturas.",
    },
    {
      name: "Volatilidad elevada",
      trigger: "La desviación de los rendimientos de las últimas 10 ruedas diarias es al menos 1,8 veces la desviación de las 40 ruedas anteriores.",
      meaning: "El precio está oscilando bastante más que su propio ritmo habitual. Por ejemplo, 2,2× significa que la dispersión reciente es 2,2 veces la base anterior.",
      caveat: "No significa +2,2%, ni predice suba o baja. La dirección es neutral.",
    },
    {
      name: "Oportunidad con múltiples señales",
      trigger: "Coinciden una recuperación alcista de tendencia y una confirmación independiente: movimiento inusual no bajista o volumen inusual.",
      meaning: "Destaca una configuración que merece revisión porque dos reglas diferentes apuntan al mismo escenario.",
      caveat: "“Oportunidad” no es una recomendación ni una probabilidad de ganancia.",
    },
  ],
  en: [
    { name: "Unusual price move", trigger: "The latest return exceeds the larger of 2.5 times recent volatility or 1.5 times ATR14 as a percentage.", meaning: "Detects an unusually large rise or fall for that same asset.", caveat: "It uses no universal percentage and does not imply continuation." },
    { name: "Unusual volume", trigger: "The latest complete bar is at least 2.2 times the prior 20-bar average, with enough valid volume.", meaning: "Signals participation well above normal.", caveat: "Volume alone does not determine direction or quality." },
    { name: "Trend change", trigger: "The close crosses EMA50 or breaks the prior 20-bar high/low, with a 0.15 ATR14 buffer.", meaning: "Marks an upward recovery or downward break of a relevant technical level.", caveat: "Technical breaks can fail and are informational." },
    { name: "Elevated volatility", trigger: "The standard deviation of returns over the latest 10 daily sessions is at least 1.8 times that of the preceding 40 sessions.", meaning: "Price is fluctuating much more than its own normal pace. A 2.2x reading means recent dispersion is 2.2 times its baseline.", caveat: "It does not mean +2.2% and predicts neither rise nor fall. Direction is neutral." },
    { name: "Multi-signal opportunity", trigger: "An upward trend recovery coincides with an independent non-down unusual move or unusual-volume confirmation.", meaning: "Highlights a setup worth reviewing because two different rules agree.", caveat: "Opportunity is neither a recommendation nor a probability of profit." },
  ],
};

const personalRules: Record<"es" | "en", GuideItem[]> = {
  es: [
    { name: "Precio alcanza o supera", trigger: "La cotización cruza el precio objetivo desde abajo.", meaning: "Sirve para enterarte de una ruptura o llegada a un nivel elegido.", caveat: "Debe existir una observación anterior por debajo; no se repite mientras permanezca arriba." },
    { name: "Precio alcanza o cae por debajo", trigger: "La cotización cruza el precio objetivo desde arriba.", meaning: "Sirve para vigilar soportes, límites de riesgo o precios de interés.", caveat: "Debe existir una observación anterior por encima; no se repite mientras permanezca abajo." },
    { name: "Suba brusca", trigger: "La variación de la rueda frente al cierre anterior alcanza el porcentaje configurado.", meaning: "Detecta una aceleración positiva durante la sesión actual.", caveat: "No compara ventanas móviles intradía; usa la variación de la rueda informada por el proveedor." },
    { name: "Baja brusca", trigger: "La caída de la rueda frente al cierre anterior alcanza el porcentaje configurado.", meaning: "Detecta una aceleración negativa durante la sesión actual.", caveat: "No compara ventanas móviles intradía; usa la variación de la rueda informada por el proveedor." },
    { name: "Cerca de la EMA 200", trigger: "La distancia absoluta entre la cotización y la EMA200 diaria es igual o menor al margen configurado.", meaning: "Avisa cuando el activo se aproxima a una referencia de tendencia de largo plazo, desde arriba o desde abajo.", caveat: "Un margen de 1% significa una banda de ±1%; no es una señal de compra o venta." },
    { name: "Cerca del mínimo del período", trigger: "La cotización queda dentro del margen configurado respecto del mínimo de las 20, 60, 120 o 200 ruedas anteriores.", meaning: "Permite vigilar proximidad a un piso reciente verificable.", caveat: "Es el mínimo del período seleccionado, no un mínimo histórico absoluto." },
    { name: "Cerca del máximo del período", trigger: "La cotización queda dentro del margen configurado respecto del máximo de las 20, 60, 120 o 200 ruedas anteriores.", meaning: "Permite vigilar proximidad a un techo reciente verificable.", caveat: "Es el máximo del período seleccionado, no un máximo histórico absoluto." },
  ],
  en: [
    { name: "Price reaches or exceeds", trigger: "The quote crosses the target from below.", meaning: "Useful for watching a breakout or arrival at a chosen level.", caveat: "A prior observation below is required; it does not repeat while price stays above." },
    { name: "Price reaches or falls below", trigger: "The quote crosses the target from above.", meaning: "Useful for supports, risk limits, or prices of interest.", caveat: "A prior observation above is required; it does not repeat while price stays below." },
    { name: "Sharp rise", trigger: "Current-session change from the prior close reaches the configured percentage.", meaning: "Detects positive acceleration in the current session.", caveat: "It uses provider session change, not a rolling intraday window." },
    { name: "Sharp fall", trigger: "Current-session decline from the prior close reaches the configured percentage.", meaning: "Detects negative acceleration in the current session.", caveat: "It uses provider session change, not a rolling intraday window." },
    { name: "Near EMA 200", trigger: "Absolute distance from daily EMA200 is at or below the configured margin.", meaning: "Notifies near a long-term trend reference from either side.", caveat: "A 1% margin is a ±1% band, not a buy or sell signal." },
    { name: "Near period low", trigger: "The quote is within the configured margin of the prior 20, 60, 120, or 200-session low.", meaning: "Watches proximity to a recent verifiable floor.", caveat: "It is the selected-period low, not an all-time low." },
    { name: "Near period high", trigger: "The quote is within the configured margin of the prior 20, 60, 120, or 200-session high.", meaning: "Watches proximity to a recent verifiable ceiling.", caveat: "It is the selected-period high, not an all-time high." },
  ],
};

function RuleGrid({ items, language }: { items: GuideItem[]; language: "es" | "en" }) {
  return <div className="mt-4 grid gap-3 lg:grid-cols-2">{items.map((item) => <article key={item.name} className="rounded-xl border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] p-5"><h3 className="font-semibold text-[var(--cma-text-primary)]">{item.name}</h3><dl className="mt-4 space-y-3 text-sm leading-6"><div><dt className="text-xs font-semibold uppercase tracking-wide text-cyan-200">{language === "es" ? "Cuándo se activa" : "When it triggers"}</dt><dd className="mt-1 text-[var(--cma-text-secondary)]">{item.trigger}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-emerald-200">{language === "es" ? "Qué significa" : "What it means"}</dt><dd className="mt-1 text-[var(--cma-text-secondary)]">{item.meaning}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-amber-200">{language === "es" ? "Qué no significa" : "What it does not mean"}</dt><dd className="mt-1 text-[var(--cma-text-secondary)]">{item.caveat}</dd></div></dl></article>)}</div>;
}

export function AlertsGuide() {
  const { language } = useLanguage();
  return <AppShell width="report"><div className="space-y-6">
    <Link href="/alerts" className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--cma-text-secondary)]"><ArrowLeft size={16} />{language === "es" ? "Centro de alertas" : "Alert center"}</Link>
    <header className="cma-panel-elevated p-6 sm:p-8"><div className="flex items-start gap-4"><div className="grid size-11 shrink-0 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-200"><BookOpen size={22} /></div><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">CMA Market Intelligence</p><h1 className="mt-2 text-3xl font-semibold">{language === "es" ? "Guía de alertas" : "Alert guide"}</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--cma-text-secondary)]">{language === "es" ? "Definiciones simples y fórmulas exactas para entender por qué se activa cada aviso. Todas las reglas son determinísticas y usan datos verificables; ninguna constituye asesoramiento ni ejecuta operaciones." : "Plain definitions and exact formulas for understanding every notification. All rules are deterministic and source-backed; none is advice or executes trades."}</p></div></div>
      <nav aria-label={language === "es" ? "Secciones de la guía" : "Guide sections"} className="mt-6 flex flex-wrap gap-2"><a href="#automaticas" className="rounded-lg border border-[var(--cma-border-soft)] px-3 py-2 text-xs">{language === "es" ? "Automáticas" : "Automatic"}</a><a href="#personales" className="rounded-lg border border-[var(--cma-border-soft)] px-3 py-2 text-xs">{language === "es" ? "Personales" : "Personal"}</a><a href="#arbitraje" className="rounded-lg border border-[var(--cma-border-soft)] px-3 py-2 text-xs">{language === "es" ? "Arbitraje" : "Arbitrage"}</a><a href="#lectura" className="rounded-lg border border-[var(--cma-border-soft)] px-3 py-2 text-xs">{language === "es" ? "Cómo leerlas" : "How to read"}</a></nav>
    </header>

    <section id="automaticas" className="cma-panel scroll-mt-5 p-6"><div className="flex items-center gap-3"><Activity className="text-cyan-200" /><div><h2 className="text-xl font-semibold">{language === "es" ? "Alertas automáticas CMA" : "CMA automatic alerts"}</h2><p className="mt-1 text-sm text-[var(--cma-text-secondary)]">{language === "es" ? "Se evalúan sobre los activos de tus listas cuando hay al menos 60 barras OHLCV, proveedor saludable y datos vigentes." : "Evaluated for watchlist assets when at least 60 OHLCV bars, a healthy provider, and current data are available."}</p></div></div><RuleGrid items={automaticRules[language]} language={language} /></section>

    <section id="personales" className="cma-panel scroll-mt-5 p-6"><div className="flex items-center gap-3"><Settings2 className="text-emerald-200" /><div><h2 className="text-xl font-semibold">{language === "es" ? "Alertas configurables" : "Configurable alerts"}</h2><p className="mt-1 text-sm text-[var(--cma-text-secondary)]">{language === "es" ? "Las creás para un activo concreto y elegís el precio, porcentaje, margen y, cuando corresponde, cantidad de ruedas." : "Created for one asset with your chosen price, percentage, margin, and period when applicable."}</p></div></div><RuleGrid items={personalRules[language]} language={language} /></section>

    <section id="arbitraje" className="cma-panel scroll-mt-5 p-6"><div className="flex items-center gap-3"><Calculator className="text-violet-200" /><div><h2 className="text-xl font-semibold">{language === "es" ? "Diferencia de cotización" : "Quote difference"}</h2><p className="mt-1 text-sm text-[var(--cma-text-secondary)]">{language === "es" ? "El Radar compara compra y venta del mismo activo y avisa cuando la diferencia bruta alcanza los ARS por USD que configuraste. Las dos cotizaciones deben haber sido consultadas por CMA dentro de cinco minutos." : "The Radar compares buy and sell quotes for the same asset and alerts at your configured ARS-per-USD gross difference. Both quotes must have been checked by CMA within five minutes."}</p></div></div><div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/5 p-5 text-sm leading-6 text-[var(--cma-text-secondary)]"><strong className="text-amber-100">{language === "es" ? "Importante:" : "Important:"}</strong> {language === "es" ? "no depende del monto y no confirma ganancia neta. Capital, comisiones, límites, disponibilidad y acreditación se analizan por separado en la calculadora y en cada proveedor." : "it is amount-independent and does not confirm net profit. Capital, fees, limits, availability, and settlement must be checked separately."}</div></section>

    <section id="lectura" className="cma-panel scroll-mt-5 p-6"><div className="flex items-center gap-3"><Gauge className="text-amber-200" /><h2 className="text-xl font-semibold">{language === "es" ? "Cómo leer una alerta" : "How to read an alert"}</h2></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-[var(--cma-border-soft)] p-4"><ShieldCheck className="text-emerald-200" /><h3 className="mt-3 font-semibold">{language === "es" ? "Confianza técnica" : "Technical confidence"}</h3><p className="mt-2 text-sm leading-6 text-[var(--cma-text-secondary)]">{language === "es" ? "Puntúa calidad y cantidad de evidencia, no probabilidad de ganancia. Informativa: menos de 50%; baja: 50–64%; media: 65–81%; alta: 82–93%; crítica: 94% o más." : "Scores evidence quality and quantity, not profit probability. Informational: below 50%; low: 50–64%; medium: 65–81%; high: 82–93%; critical: 94%+."}</p></div><div className="rounded-xl border border-[var(--cma-border-soft)] p-4"><Info className="text-sky-200" /><h3 className="mt-3 font-semibold">{language === "es" ? "Frescura y frecuencia" : "Freshness and frequency"}</h3><p className="mt-2 text-sm leading-6 text-[var(--cma-text-secondary)]">{language === "es" ? "El sistema omite señales con proveedor caído, historial insuficiente o datos vencidos. Las condiciones personales se controlan hasta cada cinco minutos durante la rueda; cripto, todos los días. Los enfriamientos evitan repetir el mismo aviso continuamente." : "Signals are suppressed for unhealthy providers, insufficient history, or stale data. Personal conditions run up to every five minutes during market sessions; crypto runs daily. Cooldowns prevent continuous repeats."}</p></div></div><div className="mt-3 rounded-xl border border-dashed border-[var(--cma-border-soft)] p-4 text-sm leading-6 text-[var(--cma-text-muted)]">{language === "es" ? "Aún no están habilitadas las alertas de noticias materiales, renta fija soberana ni obligaciones negociables: permanecen desactivadas hasta contar con fuentes licenciadas o datos completos y verificables." : "Material-news, sovereign fixed-income, and corporate-bond alerts are not enabled yet; they remain disabled until licensed sources or complete verifiable data are available."}</div></section>

    <div className="flex flex-wrap gap-3"><Link href="/alerts" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-4 text-sm font-semibold text-cyan-100"><BellRing size={16} />{language === "es" ? "Volver a mis alertas" : "Back to my alerts"}</Link><Link href="/account/alerts" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--cma-border-soft)] px-4 text-sm"><Settings2 size={16} />{language === "es" ? "Preferencias de envío" : "Delivery preferences"}</Link></div>
  </div></AppShell>;
}
