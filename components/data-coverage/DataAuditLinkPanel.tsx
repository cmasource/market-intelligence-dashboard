"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/useLanguage";

export function DataAuditLinkPanel() {
  const { language } = useLanguage();
  const isSpanish = language === "es";

  return (
    <section className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-5 text-sm text-slate-300">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p>
          {isSpanish
            ? "Compará la cobertura de precio, técnico, fundamentos, renta fija y noticias de cada instrumento en la matriz transparente de auditoría de datos."
            : "Compare each instrument's price, technical, fundamentals, fixed income and news coverage in the transparent data audit matrix."}
        </p>
        <Link
          href="/data-audit"
          className="inline-flex w-fit rounded-md border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 font-semibold text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-300/15"
        >
          {isSpanish ? "Ver auditoría de datos" : "View data audit"}
        </Link>
      </div>
    </section>
  );
}
