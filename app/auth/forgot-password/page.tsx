import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/AuthForms";
import { AuthPageShell } from "@/components/auth/AuthPageShell";

export const metadata: Metadata = { title: "Recover password | CMA Markets", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell
      eyebrow={{ en: "Account recovery", es: "Recuperación de cuenta" }}
      title={{ en: "Recover your password", es: "Recuperá tu contraseña" }}
      description={{ en: "Enter your email and we will send a secure link to choose a new password.", es: "Ingresá tu correo y te enviaremos un enlace seguro para elegir una nueva contraseña." }}
    >
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}

