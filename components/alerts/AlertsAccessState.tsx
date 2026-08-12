"use client";

import Link from "next/link";
import { BellRing, BookOpen, LogIn } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n/useLanguage";

export function AlertsAccessState({ configured }: { configured: boolean }) {
  const { language } = useLanguage();
  return (
    <AppShell>
      <section className="cma-panel mx-auto max-w-2xl p-7 text-center">
        <BellRing aria-hidden="true" className="mx-auto text-[var(--cma-accent-cyan)]" />
        <h1 className="mt-4 text-2xl font-semibold text-[var(--cma-text-primary)]">{language === "es" ? "Alertas inteligentes" : "Smart alerts"}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--cma-text-secondary)]">
          {!configured
            ? (language === "es" ? "La interfaz está lista, pero falta configurar Supabase y aplicar la migración para habilitar datos de cuenta." : "The interface is ready, but Supabase configuration and the database migration are required to enable account data.")
            : (language === "es" ? "Iniciá sesión para ver las alertas asociadas a tus listas." : "Sign in to view alerts associated with your watchlists.")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/auth/login?next=%2Falerts" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-cyan-300/35 bg-cyan-300/10 px-4 text-sm font-semibold text-cyan-100"><LogIn size={16} />{language === "es" ? "Iniciar sesión" : "Sign in"}</Link><Link href="/alerts/guide" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--cma-border-soft)] px-4 text-sm text-[var(--cma-text-secondary)]"><BookOpen size={16} />{language === "es" ? "Guía de alertas" : "Alert guide"}</Link></div>
      </section>
    </AppShell>
  );
}
