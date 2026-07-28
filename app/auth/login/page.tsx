import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/AuthForms";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { safeRedirectPath } from "@/lib/auth/redirects";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Sign in | CMA Markets", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const next = safeRedirectPath(params.next);
  return (
    <AuthPageShell
      eyebrow={{ en: "Secure access", es: "Acceso seguro" }}
      title={{ en: "Sign in to CMA Markets", es: "Ingresá a CMA Markets" }}
      description={{ en: "Access your private account area while keeping the public market experience available to everyone.", es: "Accedé a tu espacio privado de cuenta mientras la experiencia pública de mercado sigue disponible para todos." }}
    >
      <LoginForm next={next} configured={Boolean(getSupabaseConfig())} />
    </AuthPageShell>
  );
}

