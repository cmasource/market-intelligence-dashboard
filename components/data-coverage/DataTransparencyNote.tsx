"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/useLanguage";

export function DataTransparencyNote() {
  const { language } = useLanguage();
  const isSpanish = language === "es";

  return (
    <section className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm leading-6 text-slate-300">
      <p>
        {isSpanish
          ? "Los precios argentinos priorizan una fuente local configurada. En bonos no se publican TIR, paridad ni duration hasta validar terminos y calendarios oficiales."
          : "Argentine prices prioritize a configured local source. Bond YTM, parity and duration remain unpublished until official terms and schedules are validated."}
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <Link href="/data-audit" className="text-sm font-medium text-cyan-100 hover:text-white">
          {isSpanish ? "Ver auditoria de datos" : "View data audit"}
        </Link>
        <Link href="/methodology" className="text-sm font-medium text-cyan-100 hover:text-white">
          {isSpanish ? "Ver metodologia" : "View methodology"}
        </Link>
      </div>
    </section>
  );
}
