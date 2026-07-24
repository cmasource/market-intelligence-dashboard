"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n/useLanguage";

type MethodologySection = {
  title: string;
  body: string;
};

export default function MethodologyPage() {
  const { language } = useLanguage();
  const isSpanish = language === "es";

  const sections: MethodologySection[] = isSpanish
    ? [
        {
          title: "Cobertura y disponibilidad",
          body: "Cada capa se publica solo cuando una fuente configurada entrega una respuesta valida. Cuando no hay datos reales suficientes, el campo queda en N/D; la interfaz no genera precios, velas, noticias ni ratios financieros de reemplazo.",
        },
        {
          title: "Precios de mercado",
          body: "La resolucion depende del instrumento: fuentes globales para acciones, ETFs y cripto; fuentes locales configuradas para acciones argentinas, CEDEARs y bonos. La fuente efectiva y la fecha de actualizacion se conservan en la respuesta de datos.",
        },
        {
          title: "Analisis tecnico",
          body: "El motor calcula tendencia, medias moviles, RSI, MACD, volumen, soporte y resistencia desde una misma serie OHLCV real. El score tecnico se publica una sola vez por activo y se reutiliza en el resumen y el detalle.",
        },
        {
          title: "Analisis fundamental",
          body: "El score fundamental evalua valuacion, rentabilidad, crecimiento, solvencia y perfil de mercado. Los porcentajes recibidos en puntos porcentuales se normalizan antes del calculo y la cobertura se informa por separado para no confundir calidad con cantidad de campos disponibles.",
        },
        {
          title: "Lectura integrada",
          body: "La lectura integrada combina los scores tecnico y fundamental disponibles con su cobertura. No recalcula indicadores en la interfaz ni crea una segunda version del resultado. Es informativa y no constituye una orden de compra o venta.",
        },
        {
          title: "CEDEAR y CCL implicito",
          body: "El CCL implicito se calcula solo cuando existen precio local real, ratio vigente del maestro de instrumentos y precio real del subyacente: precio CEDEAR ARS por ratio dividido precio subyacente USD. Si falta una capa, el resultado queda en N/D.",
        },
        {
          title: "Renta fija argentina",
          body: "La ficha publica la cotizacion local disponible. TIR, paridad, duration y convexidad requieren terminos oficiales y un calendario de flujos validado; hasta integrar esa informacion no se estiman ni se muestran.",
        },
        {
          title: "Noticias y documentos",
          body: "Las noticias se muestran solo desde proveedores o RSS verificables. Los documentos societarios deben provenir de CNV u otra fuente identificable antes de incorporarse a una lectura publica.",
        },
        {
          title: "Diferencias con otras plataformas",
          body: "Pueden existir diferencias por proveedor, horario de corte, ajuste de precios, zona horaria, frecuencia de actualizacion o convencion del instrumento. TradingView se usa como visualizacion independiente y no como API de los scores internos.",
        },
      ]
    : [
        {
          title: "Coverage and availability",
          body: "Each layer is published only when a configured source returns a valid response. When real data is insufficient, the field remains N/A; the interface does not generate replacement prices, candles, news, or financial ratios.",
        },
        {
          title: "Market prices",
          body: "Resolution depends on the instrument: global sources for stocks, ETFs, and crypto; configured local sources for Argentine equities, CEDEARs, and bonds. The effective source and update timestamp are preserved in the data response.",
        },
        {
          title: "Technical analysis",
          body: "The engine calculates trend, moving averages, RSI, MACD, volume, support, and resistance from one real OHLCV series. The technical score is published once per asset and reused by the summary and detail views.",
        },
        {
          title: "Fundamental analysis",
          body: "The fundamental score evaluates valuation, profitability, growth, solvency, and market profile. Percentage points are normalized before scoring, while coverage is reported separately so data availability is not confused with quality.",
        },
        {
          title: "Integrated reading",
          body: "The integrated reading combines the available technical and fundamental scores with their coverage. The UI does not recalculate indicators or create a second result. It is informational and is not a buy or sell order.",
        },
        {
          title: "CEDEAR and implied CCL",
          body: "Implied CCL is calculated only when a real local price, a current instrument-master ratio, and a real underlying price are available: CEDEAR ARS price times ratio divided by underlying USD price. Otherwise it remains N/A.",
        },
        {
          title: "Argentine fixed income",
          body: "The asset page publishes an available local quote. YTM, parity, duration, and convexity require official terms and a validated cash-flow schedule; they are not estimated or displayed until those inputs are integrated.",
        },
        {
          title: "News and documents",
          body: "News is shown only from verifiable providers or RSS sources. Corporate documents must come from CNV or another identifiable source before entering a public reading.",
        },
        {
          title: "Differences versus other platforms",
          body: "Differences may result from provider, market cutoff, price adjustment, timezone, update frequency, or instrument convention. TradingView is an independent visualization and is not the API behind internal scores.",
        },
      ];

  return (
    <AppShell>
      <div className="space-y-8 py-6">
        <section className="cma-panel-elevated cma-glow-cyan p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">CMA Markets</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">
            {isSpanish ? "Metodologia" : "Methodology"}
          </h1>
          <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-300">
            {isSpanish
              ? "Criterios unicos para precios, indicadores, scores y cobertura de datos."
              : "One set of rules for prices, indicators, scores, and data coverage."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/data-audit" className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100">
              {isSpanish ? "Ver auditoria" : "View audit"}
            </Link>
            <Link href="/status" className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300">
              {isSpanish ? "Estado de fuentes" : "Source status"}
            </Link>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          {sections.map((section) => (
            <section key={section.title} className="cma-panel p-5">
              <h2 className="text-lg font-semibold text-white">{section.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
