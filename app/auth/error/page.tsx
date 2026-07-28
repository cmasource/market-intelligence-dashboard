"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n/useLanguage";

export default function AuthErrorPage() {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  return (
    <AppShell width="report">
      <section className="cma-panel mx-auto my-12 max-w-xl p-7 text-center">
        <p className="cma-kicker">{isSpanish ? "Acceso no completado" : "Access not completed"}</p>
        <h1 className="mt-4 text-3xl font-semibold text-[var(--cma-text-primary)]">{isSpanish ? "El enlace no pudo validarse" : "The link could not be validated"}</h1>
        <p className="mt-4 text-sm leading-6 text-[var(--cma-text-secondary)]">{isSpanish ? "El enlace puede haber vencido o ya haber sido utilizado. Solicitá uno nuevo e intentá otra vez." : "The link may have expired or already been used. Request a new one and try again."}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/auth/login" className="rounded-md bg-[var(--cma-accent-cyan)] px-4 py-2 text-sm font-semibold text-[#07110f]">{isSpanish ? "Iniciar sesión" : "Sign in"}</Link>
          <Link href="/auth/forgot-password" className="rounded-md border border-[var(--cma-border-soft)] px-4 py-2 text-sm font-semibold text-[var(--cma-text-secondary)]">{isSpanish ? "Recuperar contraseña" : "Recover password"}</Link>
        </div>
      </section>
    </AppShell>
  );
}

