"use client";

import Link from "next/link";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { signOutAction } from "@/app/auth/actions";
import { useLanguage } from "@/lib/i18n/useLanguage";

export function AuthNavigation({
  authenticated,
  collapsed,
  onNavigate,
}: {
  authenticated: boolean;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const { language } = useLanguage();

  if (authenticated) {
    return (
      <div className="space-y-2">
        <Link href="/account" onClick={onNavigate} title={collapsed ? (language === "es" ? "Mi cuenta" : "Account") : undefined} className="flex min-h-9 items-center gap-2 rounded-md border border-[var(--cma-border-soft)] px-2.5 text-sm font-medium text-[var(--cma-text-secondary)] hover:text-[var(--cma-text-primary)]">
          <UserRound size={16} />{collapsed ? null : language === "es" ? "Mi cuenta" : "Account"}
        </Link>
        {!collapsed ? <form action={signOutAction}><button type="submit" className="flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 text-sm text-[var(--cma-text-muted)] hover:text-[var(--cma-text-primary)]"><LogOut size={16} />{language === "es" ? "Cerrar sesión" : "Sign out"}</button></form> : null}
      </div>
    );
  }

  return (
    <Link href="/auth/login" onClick={onNavigate} title={collapsed ? (language === "es" ? "Iniciar sesión" : "Sign in") : undefined} className="flex min-h-9 items-center gap-2 rounded-md border border-[var(--cma-border-strong)] px-2.5 text-sm font-semibold text-[var(--cma-accent-cyan)] hover:bg-[var(--cma-bg-elevated)]">
      <LogIn size={16} />{collapsed ? null : language === "es" ? "Iniciar sesión" : "Sign in"}
    </Link>
  );
}
