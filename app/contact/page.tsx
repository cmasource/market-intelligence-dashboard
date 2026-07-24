"use client";

import { ArrowUpRight, Mail, Send } from "lucide-react";
import Image from "next/image";
import { FormEvent } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n/useLanguage";

const contactEmail = "carlosmatiasalvarez.cma@gmail.com";

export default function ContactPage() {
  const { language } = useLanguage();
  const isSpanish = language === "es";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "");
    const company = String(data.get("company") ?? "");
    const email = String(data.get("email") ?? "");
    const message = String(data.get("message") ?? "");
    const subject = encodeURIComponent(`Consulta CMA Markets - ${name || company}`);
    const body = encodeURIComponent(`Nombre: ${name}\nEmpresa: ${company}\nEmail: ${email}\n\n${message}`);
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
  }

  return (
    <AppShell>
      <div className="space-y-8 py-6">
        <section className="overflow-hidden rounded-lg border border-cyan-300/20 bg-slate-900/70">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 sm:p-9 lg:p-12">
              <p className="cma-kicker">CMA Consulting</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold text-white sm:text-5xl">{isSpanish ? "Conversemos sobre decisiones mejor informadas" : "Let us talk about better-informed decisions"}</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">{isSpanish ? "CMA Markets fue desarrollado por CMA Source, la division de tecnologia e inteligencia aplicada de CMA Consulting. Integramos estrategia, finanzas y datos para convertir informacion compleja en herramientas de decision." : "CMA Markets was developed by CMA Source, CMA Consulting's applied technology and intelligence division. We combine strategy, finance, and data to turn complex information into decision tools."}</p>
              <a href="https://cma-consulting.vercel.app/" target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex items-center gap-2 rounded-md bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">{isSpanish ? "Conocer CMA Consulting" : "Visit CMA Consulting"}<ArrowUpRight size={17} /></a>
            </div>
            <div className="flex min-h-72 flex-col justify-between border-t border-white/10 bg-slate-950/70 p-6 lg:border-l lg:border-t-0 sm:p-8">
              <a href="https://cma-consulting.vercel.app/" target="_blank" rel="noopener noreferrer" className="group inline-flex max-w-sm flex-col items-start">
                <Image src="/brand/cma-consulting-header-transparent.png" alt="CMA Consulting" width={622} height={144} className="h-auto w-full max-w-72 rounded bg-white p-3 transition group-hover:bg-cyan-50" />
                <span className="mt-5 inline-flex items-center gap-2 text-base font-semibold text-white group-hover:text-cyan-200">
                  {isSpanish ? "Consultoria estrategica y financiera" : "Strategic and financial consulting"}<ArrowUpRight size={17} />
                </span>
              </a>
              <div className="mt-10 border-t border-white/10 pt-5">
                <p className="text-xs font-semibold uppercase text-slate-500">CMA Source</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{isSpanish ? "Division de datos, automatizacion e inteligencia aplicada de CMA Consulting." : "CMA Consulting's data, automation, and applied intelligence division."}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div className="px-1 py-4">
            <p className="cma-kicker">{isSpanish ? "Contacto" : "Contact"}</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">{isSpanish ? "Contanos que necesitas" : "Tell us what you need"}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">{isSpanish ? "Consultas sobre el dashboard, proyectos de inteligencia de negocios, estrategia financiera o desarrollos a medida." : "Questions about the dashboard, business intelligence projects, financial strategy, or custom developments."}</p>
            <a href={`mailto:${contactEmail}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 hover:text-white"><Mail size={16} />{contactEmail}</a>
          </div>
          <form onSubmit={submit} className="cma-panel grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            <label className="text-sm font-medium text-slate-300">{isSpanish ? "Nombre" : "Name"}<input required name="name" className="mt-2 h-11 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="text-sm font-medium text-slate-300">{isSpanish ? "Empresa" : "Company"}<input name="company" className="mt-2 h-11 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="text-sm font-medium text-slate-300 sm:col-span-2">Email<input required type="email" name="email" className="mt-2 h-11 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-white outline-none focus:border-cyan-300/45" /></label>
            <label className="text-sm font-medium text-slate-300 sm:col-span-2">{isSpanish ? "Mensaje" : "Message"}<textarea required name="message" rows={5} className="mt-2 w-full resize-y rounded-md border border-white/10 bg-slate-950/70 p-3 text-white outline-none focus:border-cyan-300/45" /></label>
            <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-cyan-300 px-4 text-sm font-semibold text-slate-950 hover:bg-cyan-200 sm:col-span-2 sm:justify-self-start"><Send size={17} />{isSpanish ? "Preparar mensaje" : "Prepare message"}</button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
