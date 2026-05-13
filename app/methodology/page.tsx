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
      title: isSpanish ? "Limitaciones actuales" : "Current limitations",
      body: isSpanish
        ? "Pueden existir diferencias frente a plataformas externas por fuente de datos, ajuste de precios, zona horaria, metodología de indicadores y frecuencia de actualización."
        : "Differences versus external platforms can come from data source, price adjustment, timezone, indicator methodology and update frequency.",
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
              ? "Cómo se interpretan datos, indicadores, señales, fundamentos y renta fija dentro de la demo pública."
              : "How data, indicators, signals, fundamentals and fixed income are interpreted inside the public demo."}
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
