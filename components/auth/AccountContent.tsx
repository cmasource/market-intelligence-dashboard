"use client";

import Link from "next/link";
import { CalendarDays, CheckCircle2, KeyRound, Mail, UserRound } from "lucide-react";
import { signOutAction } from "@/app/auth/actions";
import { AppShell } from "@/components/layout/AppShell";
import { ProfileForm } from "@/components/auth/AuthForms";
import { useLanguage } from "@/lib/i18n/useLanguage";

type AccountContentProps = {
  email: string;
  displayName: string;
  provider: "google" | "email";
  createdAt: string;
  passwordUpdated: boolean;
};

export function AccountContent({ email, displayName, provider, createdAt, passwordUpdated }: AccountContentProps) {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const createdLabel = new Intl.DateTimeFormat(isSpanish ? "es-AR" : "en-US", { dateStyle: "medium" }).format(new Date(createdAt));
  const providerLabel = provider === "google" ? "Google" : "Email";

  return (
    <AppShell width="report">
      <div className="space-y-6 py-6">
        <section className="cma-panel-elevated p-6 sm:p-8">
          <p className="cma-kicker">{isSpanish ? "Cuenta privada" : "Private account"}</p>
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-[var(--cma-text-primary)]">{displayName || (isSpanish ? "Mi cuenta" : "My account")}</h1>
              <p className="mt-2 text-sm text-[var(--cma-text-secondary)]">{isSpanish ? "Administrá tu identidad y seguridad de acceso." : "Manage your identity and sign-in security."}</p>
            </div>
            <form action={signOutAction}><button type="submit" className="min-h-10 rounded-md border border-[var(--cma-border-soft)] px-4 text-sm font-semibold text-[var(--cma-text-secondary)] hover:border-[var(--cma-border-strong)] hover:text-[var(--cma-text-primary)]">{isSpanish ? "Cerrar sesión" : "Sign out"}</button></form>
          </div>
          {passwordUpdated ? <p role="status" className="mt-5 rounded-md border border-emerald-300/25 bg-emerald-300/[0.07] p-3 text-sm text-emerald-200">{isSpanish ? "Tu contraseña fue actualizada." : "Your password was updated."}</p> : null}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="cma-panel p-5 sm:p-6">
            <div className="flex items-center gap-2"><UserRound size={19} className="text-[var(--cma-accent-cyan)]" /><h2 className="text-xl font-semibold text-[var(--cma-text-primary)]">{isSpanish ? "Perfil básico" : "Basic profile"}</h2></div>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex gap-3"><Mail size={17} className="mt-0.5 shrink-0 text-[var(--cma-text-muted)]" /><div><dt className="text-[var(--cma-text-muted)]">{isSpanish ? "Correo" : "Email"}</dt><dd className="mt-1 break-all font-medium text-[var(--cma-text-primary)]">{email}</dd></div></div>
              <div className="flex gap-3"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-300" /><div><dt className="text-[var(--cma-text-muted)]">{isSpanish ? "Estado" : "Status"}</dt><dd className="mt-1 font-medium text-[var(--cma-text-primary)]">{isSpanish ? "Correo confirmado" : "Email confirmed"}</dd></div></div>
              <div className="flex gap-3"><KeyRound size={17} className="mt-0.5 shrink-0 text-[var(--cma-text-muted)]" /><div><dt className="text-[var(--cma-text-muted)]">{isSpanish ? "Método de acceso" : "Sign-in method"}</dt><dd className="mt-1 font-medium text-[var(--cma-text-primary)]">{providerLabel}</dd></div></div>
              <div className="flex gap-3"><CalendarDays size={17} className="mt-0.5 shrink-0 text-[var(--cma-text-muted)]" /><div><dt className="text-[var(--cma-text-muted)]">{isSpanish ? "Cuenta creada" : "Account created"}</dt><dd className="mt-1 font-medium text-[var(--cma-text-primary)]">{createdLabel}</dd></div></div>
            </dl>
          </section>
          <section className="cma-panel p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-[var(--cma-text-primary)]">{isSpanish ? "Nombre de perfil" : "Profile name"}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--cma-text-secondary)]">{isSpanish ? "Este nombre identifica tu espacio de cuenta." : "This name identifies your account space."}</p>
            <div className="mt-5"><ProfileForm displayName={displayName} /></div>
          </section>
        </div>

        <section className="cma-panel p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-[var(--cma-text-primary)]">{isSpanish ? "Seguridad" : "Security"}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--cma-text-secondary)]">{isSpanish ? "Podés definir una nueva contraseña desde una sesión validada." : "You can choose a new password from a validated session."}</p>
          <div className="mt-4 flex flex-wrap gap-2"><Link href="/auth/update-password" className="inline-flex min-h-10 items-center rounded-md border border-[var(--cma-border-strong)] px-4 text-sm font-semibold text-[var(--cma-accent-cyan)]">{isSpanish ? "Cambiar contraseña" : "Change password"}</Link><Link href="/account/alerts" className="inline-flex min-h-10 items-center rounded-md border border-[var(--cma-border-strong)] px-4 text-sm font-semibold text-[var(--cma-accent-cyan)]">{isSpanish ? "Configurar alertas" : "Alert settings"}</Link></div>
        </section>

        <section className="rounded-lg border border-amber-300/20 bg-amber-300/[0.05] p-5 text-sm leading-6 text-[var(--cma-text-secondary)]">
          <strong className="text-[var(--cma-text-primary)]">{isSpanish ? "Listas de cuenta:" : "Account watchlists:"}</strong>{" "}{isSpanish ? "las listas que crees mientras estás autenticado quedan asociadas a tu cuenta. Las listas anónimas siguen separadas y permanecen sólo en este navegador." : "lists created while signed in belong to your account. Anonymous lists remain separate and stay only in this browser."}
        </section>
      </div>
    </AppShell>
  );
}
