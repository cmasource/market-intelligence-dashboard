import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UpdatePasswordForm } from "@/components/auth/AuthForms";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Update password | CMA Markets", robots: { index: false, follow: false } };

export default async function UpdatePasswordPage() {
  const configured = getSupabaseConfig();
  if (!configured) redirect("/auth/login?next=%2Fauth%2Fupdate-password");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/auth/login?next=%2Fauth%2Fupdate-password");

  return (
    <AuthPageShell
      eyebrow={{ en: "Account security", es: "Seguridad de la cuenta" }}
      title={{ en: "Choose a new password", es: "Elegí una nueva contraseña" }}
      description={{ en: "Use at least eight characters and avoid reusing a password from another service.", es: "Usá al menos ocho caracteres y evitá reutilizar una contraseña de otro servicio." }}
    >
      <UpdatePasswordForm />
    </AuthPageShell>
  );
}

