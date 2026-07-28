"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n/useLanguage";

type AuthPageShellProps = {
  eyebrow: { en: string; es: string };
  title: { en: string; es: string };
  description: { en: string; es: string };
  children: React.ReactNode;
};

export function AuthPageShell({ eyebrow, title, description, children }: AuthPageShellProps) {
  const { language } = useLanguage();
  const copy = language === "es" ? "es" : "en";

  return (
    <AppShell width="report">
      <div className="grid gap-6 py-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <section className="cma-panel-elevated p-6 sm:p-8">
          <p className="cma-kicker">{eyebrow[copy]}</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--cma-text-primary)] sm:text-4xl">
            {title[copy]}
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--cma-text-secondary)]">{description[copy]}</p>
          <div className="mt-7 flex gap-3 rounded-lg border border-emerald-300/20 bg-emerald-300/[0.06] p-4">
            <ShieldCheck className="mt-0.5 shrink-0 text-emerald-300" size={20} aria-hidden="true" />
            <p className="text-sm leading-6 text-[var(--cma-text-secondary)]">
              {copy === "es"
                ? "La sesión se mantiene mediante cookies seguras. Tus listas actuales siguen guardadas sólo en este navegador y no se sincronizan con la cuenta."
                : "Your session is maintained with secure cookies. Existing watchlists remain only in this browser and are not synced with your account."}
            </p>
          </div>
          <Link href="/" className="mt-6 inline-flex text-sm font-semibold text-[var(--cma-accent-cyan)] hover:underline">
            {copy === "es" ? "Volver al mercado" : "Back to markets"}
          </Link>
        </section>
        <section className="cma-panel p-5 sm:p-7">{children}</section>
      </div>
    </AppShell>
  );
}

