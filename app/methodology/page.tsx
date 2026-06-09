"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n/useLanguage";

export default function MethodologyPage() {
  const { language } = useLanguage();
  const isSpanish = language === "es";

  const sections = [
    {
      title: isSpanish ? "Modelo de cobertura de datos" : "Data coverage model",
      body: isSpanish
        ? "La plataforma distingue datos reales, datos de proveedor, datos simulados, fallback, cobertura futura, no aplicable y no disponible."
        : "The platform distinguishes real data, provider data, mock data, fallback, future coverage, not applicable and unavailable layers.",
    },
    {
      title: isSpanish ? "Cadena de proveedores reales" : "Real provider chain",
      body: isSpanish
        ? "La app intenta proveedores configurados por variables de entorno en este orden: FMP, Finnhub, Alpha Vantage, Yahoo/RSS y datos simulados. Si una clave falta o una llamada falla, la capa vuelve a fallback sin romper la experiencia."
        : "The app attempts providers configured through environment variables in this order: FMP, Finnhub, Alpha Vantage, Yahoo/RSS and mock data. If a key is missing or a request fails, the layer falls back without breaking the experience.",
    },
    {
      title: isSpanish ? "Metodología de análisis técnico" : "Technical analysis methodology",
      body: isSpanish
        ? "Los indicadores se calculan desde velas OHLCV del proveedor cuando existen. Si el proveedor falla, se usan datos simulados de respaldo para preservar la experiencia de demo."
        : "Indicators are calculated from provider OHLCV candles when available. If the provider fails, fallback mock data preserves the demo experience.",
    },
    {
      title: isSpanish ? "Metodología de señal de mercado" : "Market signal methodology",
      body: isSpanish
        ? "Para acciones y ETFs, la señal combina análisis técnico y fundamentos cuando ambos están disponibles. Si solo existe una capa, la confianza se marca como limitada."
        : "For stocks and ETFs, the signal combines technical analysis and fundamentals when both are available. If only one layer exists, confidence is marked as limited.",
    },
    {
      title: isSpanish ? "Metodologia de lectura ejecutiva" : "Executive reading methodology",
      body: isSpanish
        ? "La lectura ejecutiva combina precio, tecnico, fundamentos, noticias, riesgos y cobertura de datos. No genera recomendaciones de inversion; usa etiquetas informativas como defensivo, neutral o constructivo y muestra advertencias cuando hay fallback, simulacion o cobertura futura."
        : "The executive reading combines price, technicals, fundamentals, news, risks and data coverage. It does not generate investment recommendations; it uses informational labels such as defensive, neutral or constructive and shows warnings when data is fallback, mock or future coverage.",
    },
    {
      title: isSpanish ? "Metodología fundamental" : "Fundamental analysis methodology",
      body: isSpanish
        ? "Los fundamentos de acciones USA se intentan obtener por proveedor público compatible y vuelven a datos simulados si la respuesta es insuficiente. Cripto y renta fija no usan fundamentos de equity."
        : "USA stock fundamentals are attempted through a public compatible provider and fall back to mock data if the response is insufficient. Crypto and fixed income do not use equity fundamentals.",
    },
    {
      title: isSpanish ? "Metodología de renta fija" : "Fixed income methodology",
      body: isSpanish
        ? "La renta fija argentina usa datos estructurados simulados y cálculos internos para flujos, TIR, duration, convexity y riesgo. BYMA/IOL/CNV todavía no están integrados."
        : "Argentina fixed income uses structured mock data and internal calculations for cash flows, YTM, duration, convexity and risk. BYMA/IOL/CNV are not integrated yet.",
    },
    {
      title: isSpanish ? "Metodología CEDEAR y CCL implícito" : "CEDEAR and implied CCL methodology",
      body: isSpanish
        ? "Un CEDEAR es un instrumento local vinculado a un activo subyacente internacional. El ratio indica cuántos CEDEARs equivalen a una acción subyacente. En esta demo, CCL implícito = precio local ARS del CEDEAR * ratio / precio USD del subyacente. Los precios locales y ratios son simulados; el precio del subyacente puede usar proveedor o fallback. El análisis técnico y fundamental se basa en el subyacente cuando no existe integración real del CEDEAR local."
        : "A CEDEAR is a local instrument linked to an international underlying asset. The ratio states how many CEDEARs equal one underlying share. In this demo, implied CCL = local CEDEAR ARS price * ratio / underlying USD price. Local prices and ratios are mock; the underlying price can use provider or fallback data. Technical and fundamental analysis is based on the underlying asset when local CEDEAR integration is not available.",
    },
    {
      title: isSpanish ? "Noticias MVP" : "News MVP",
      body: isSpanish
        ? "Las noticias intentan proveedores configurados o RSS público y vuelven a titulares simulados si no hay claves o si la red falla. Solo se muestran título, fuente, fecha, enlace y resumen breve disponible."
        : "News attempts configured providers or public RSS and falls back to mock headlines if keys are missing or the network fails. Only title, source, date, link and short available summary are shown.",
    },
    {
      title: isSpanish ? "Metodología de datos Argentina" : "Argentina data methodology",
      body: isSpanish
        ? "La capa Argentina puede usar cargas manuales validadas, futuras integraciones BYMA/proveedor o respaldo estructurado simulado. La carga manual es un paso intermedio para mostrar valores locales reales mientras se gestionan integraciones oficiales. CNV se planifica para hechos relevantes, presentaciones y fundamentos, no para precios intradiarios. BYMA, IOL, PPI o proveedores licenciados quedan como rutas futuras para cotizaciones."
        : "The Argentina layer can use validated manual loads, future BYMA/provider integrations or structured mock fallback. Manual data is an interim step to show real local values while official integrations are pending. CNV is planned for filings, relevant facts and fundamentals, not intraday prices. BYMA, IOL, PPI or licensed providers remain future quote paths.",
    },
      {
        title: isSpanish ? "Metodologia de documentos CNV" : "CNV documents methodology",
        body: isSpanish
          ? "La capa CNV se orienta a emisoras, estados financieros, hechos relevantes y documentacion societaria. La version actual usa documentos estructurados de demostracion o cargas manuales futuras; no consulta endpoints privados ni scrapea brokers. CNV no se utiliza para precios de mercado en vivo."
          : "The CNV layer is designed for issuers, financial statements, relevant events and corporate documents. The current version uses structured demo documents or future manual loads; it does not call private endpoints or scrape brokers. CNV is not used for live market prices.",
      },
      {
        title: isSpanish ? "Cobertura objetivo del universo" : "Target universe coverage",
        body: isSpanish
          ? "Acciones USA con relacion CEDEAR usan datos de proveedor o fallback para el subyacente. Los precios locales de CEDEAR, acciones argentinas y bonos dependen de la capa Argentina con carga manual, datos estructurados simulados o cobertura futura hasta integrar BYMA, IOL, PPI o proveedor licenciado."
          : "USA stocks with a CEDEAR relationship use provider or fallback data for the underlying. Local CEDEAR prices, Argentine equities and bonds depend on the Argentina layer with manual loads, structured mock data or future coverage until BYMA, IOL, PPI or a licensed provider is integrated.",
      },
      {
        title: isSpanish ? "Limitaciones actuales" : "Current limitations",
      body: isSpanish
        ? "Pueden existir diferencias frente a plataformas externas por fuente de datos, ajuste de precios, zona horaria, metodología de indicadores, frecuencia de actualización y convención de ratio CEDEAR."
        : "Differences versus external platforms can come from data source, price adjustment, timezone, indicator methodology, update frequency and CEDEAR ratio convention.",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-8 py-6">
        <section className="rounded-lg border border-cyan-300/20 bg-slate-900/70 p-6 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">CMA Market Intelligence</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            {isSpanish ? "Metodología" : "Methodology"}
          </h1>
          <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-300">
            {isSpanish
              ? "Cómo se interpretan datos, indicadores, señales, fundamentos, renta fija y CEDEARs dentro de la demo pública."
              : "How data, indicators, signals, fundamentals, fixed income and CEDEARs are interpreted inside the public demo."}
          </p>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          {sections.map((section) => (
            <section key={section.title} className="rounded-lg border border-white/10 bg-slate-950/55 p-5">
              <h2 className="text-xl font-semibold text-white">{section.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{section.body}</p>
            </section>
          ))}
        </div>

        <section className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-5">
          <h2 className="text-xl font-semibold text-white">{isSpanish ? "No es asesoramiento financiero" : "Not investment advice"}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {isSpanish
              ? "Esta plataforma brinda análisis informativo y no constituye asesoramiento financiero personalizado ni recomendación de inversión."
              : "This platform provides informational analysis only and does not constitute personalized financial advice or an investment recommendation."}
          </p>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href="/data-audit" className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100">
            {isSpanish ? "Ver auditoría de datos" : "View data audit"}
          </Link>
          <Link href="/status" className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300">
            {isSpanish ? "Ver estado" : "View status"}
          </Link>
          <Link href="/screener" className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300">
            {isSpanish ? "Abrir screener" : "Open screener"}
          </Link>
          <Link href="/glossary" className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300">
            {isSpanish ? "Ver glosario" : "View glossary"}
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
