import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/AuthForms";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { safeRedirectPath } from "@/lib/auth/redirects";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Create account | CMA Markets", robots: { index: false, follow: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const next = safeRedirectPath(params.next);
  return (
    <AuthPageShell
      eyebrow={{ en: "CMA Markets account", es: "Cuenta CMA Markets" }}
      title={{ en: "Create your account", es: "Creá tu cuenta" }}
      description={{ en: "Register with email and password or continue with Google. Email accounts require confirmation.", es: "Registrate con correo y contraseña o continuá con Google. Las cuentas por correo requieren confirmación." }}
    >
      <RegisterForm next={next} configured={Boolean(getSupabaseConfig())} />
    </AuthPageShell>
  );
}

