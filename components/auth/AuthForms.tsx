"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  requestPasswordResetAction,
  signInAction,
  signUpAction,
  updatePasswordAction,
  updateProfileAction,
  type AuthActionState,
} from "@/app/auth/actions";
import { authErrorMessage } from "@/lib/auth/messages";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/useLanguage";

const inputClass = "mt-2 h-11 w-full rounded-md border border-[var(--cma-border-soft)] bg-[var(--cma-bg-base)] px-3 text-[var(--cma-text-primary)] outline-none transition placeholder:text-[var(--cma-text-muted)] focus:border-[var(--cma-border-strong)]";
const labelClass = "text-sm font-medium text-[var(--cma-text-secondary)]";
const initialAuthState: AuthActionState = { status: "idle" };

function SubmitButton({ en, es }: { en: string; es: string }) {
  const { pending } = useFormStatus();
  const { language } = useLanguage();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[var(--cma-accent-cyan)] px-4 text-sm font-semibold text-[#07110f] transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? (language === "es" ? "Procesando..." : "Processing...") : language === "es" ? es : en}
    </button>
  );
}

function StateMessage({ state }: { state: AuthActionState }) {
  const { language } = useLanguage();
  if (state.status === "idle") return null;

  const isSpanish = language === "es";
  const local: Record<string, string> = {
    configuration_missing: isSpanish
      ? "La autenticación todavía no está conectada. Falta configurar el proyecto Supabase."
      : "Authentication is not connected yet. The Supabase project must be configured.",
    invalid_form: isSpanish ? "Revisá los datos ingresados." : "Check the information entered.",
    password_mismatch: isSpanish ? "Las contraseñas no coinciden o son demasiado cortas." : "Passwords do not match or are too short.",
    invalid_name: isSpanish ? "Ingresá un nombre de entre 2 y 80 caracteres." : "Enter a name between 2 and 80 characters.",
    confirmation_sent: isSpanish ? "Te enviamos un correo para confirmar tu cuenta." : "We sent you an email to confirm your account.",
    recovery_sent: isSpanish ? "Si existe una cuenta con ese correo, recibirás un enlace de recuperación." : "If an account exists for that email, you will receive a recovery link.",
    profile_updated: isSpanish ? "Tu perfil fue actualizado." : "Your profile was updated.",
  };
  const message = (state.code && local[state.code]) || authErrorMessage(state.code, language);

  return (
    <p
      role="status"
      className={`rounded-md border p-3 text-sm ${state.status === "success" ? "border-emerald-300/25 bg-emerald-300/[0.07] text-emerald-200" : "border-rose-300/25 bg-rose-300/[0.07] text-rose-200"}`}
    >
      {message}
    </p>
  );
}

function GoogleButton({ next, configured }: { next: string; configured: boolean }) {
  const { language } = useLanguage();
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  async function signInWithGoogle() {
    setError(false);
    setPending(true);
    if (!configured) {
      setError(true);
      setPending(false);
      return;
    }
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", next);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString() },
    });
    if (oauthError) {
      setError(true);
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={pending}
        aria-busy={pending}
        className="group inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-md border border-[var(--cma-border-strong)] bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-px hover:border-slate-400 hover:bg-slate-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 disabled:cursor-wait disabled:opacity-70"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" role="img"><path fill="#4285F4" d="M21.6 12.23c0-.78-.07-1.53-.2-2.25H12v4.26h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.22c1.89-1.74 2.99-4.3 2.99-7.54Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.43l-3.22-2.51c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.06v2.59A9.98 9.98 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.39 13.89A6 6 0 0 1 6.07 12c0-.66.11-1.3.32-1.89V7.52H3.06A10 10 0 0 0 2 12c0 1.61.39 3.13 1.06 4.48l3.33-2.59Z"/><path fill="#EA4335" d="M12 5.98c1.47 0 2.79.5 3.83 1.49l2.87-2.87C16.95 2.9 14.7 2 12 2a9.98 9.98 0 0 0-8.94 5.52l3.33 2.59C7.18 7.74 9.39 5.98 12 5.98Z"/></svg>
        {pending ? (language === "es" ? "Conectando..." : "Connecting...") : language === "es" ? "Continuar con Google" : "Continue with Google"}
      </button>
      {error ? <p role="alert" className="mt-2 text-sm text-rose-200">{language === "es" ? "No pudimos iniciar el acceso con Google." : "Google sign-in could not be started."}</p> : null}
    </div>
  );
}

function Divider() {
  const { language } = useLanguage();
  return (
    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-[var(--cma-text-muted)]">
      <span className="h-px flex-1 bg-[var(--cma-border-soft)]" />
      {language === "es" ? "o" : "or"}
      <span className="h-px flex-1 bg-[var(--cma-border-soft)]" />
    </div>
  );
}

export function LoginForm({ next, configured }: { next: string; configured: boolean }) {
  const { language } = useLanguage();
  const [state, action] = useActionState(signInAction, initialAuthState);
  return (
    <div className="space-y-5">
      <GoogleButton next={next} configured={configured} />
      <Divider />
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <label className={labelClass}>Email<input className={inputClass} type="email" name="email" autoComplete="email" required /></label>
        <label className={labelClass}>{language === "es" ? "Contraseña" : "Password"}<input className={inputClass} type="password" name="password" autoComplete="current-password" required /></label>
        <StateMessage state={state} />
        <SubmitButton en="Sign in" es="Iniciar sesión" />
      </form>
      <div className="flex flex-col gap-2 text-sm text-[var(--cma-text-secondary)] sm:flex-row sm:justify-between">
        <Link href="/auth/forgot-password" className="hover:text-[var(--cma-accent-cyan)]">{language === "es" ? "Olvidé mi contraseña" : "Forgot password"}</Link>
        <Link href={`/auth/register?next=${encodeURIComponent(next)}`} className="font-semibold text-[var(--cma-accent-cyan)] hover:underline">{language === "es" ? "Crear cuenta" : "Create account"}</Link>
      </div>
    </div>
  );
}

export function RegisterForm({ next, configured }: { next: string; configured: boolean }) {
  const { language } = useLanguage();
  const [state, action] = useActionState(signUpAction, initialAuthState);
  return (
    <div className="space-y-5">
      <GoogleButton next={next} configured={configured} />
      <Divider />
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <label className={labelClass}>{language === "es" ? "Nombre" : "Name"}<input className={inputClass} name="displayName" autoComplete="name" minLength={2} maxLength={80} required /></label>
        <label className={labelClass}>Email<input className={inputClass} type="email" name="email" autoComplete="email" required /></label>
        <label className={labelClass}>{language === "es" ? "Contraseña" : "Password"}<input className={inputClass} type="password" name="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required /><span className="mt-1.5 block text-xs text-[var(--cma-text-muted)]">{language === "es" ? `Mínimo ${MIN_PASSWORD_LENGTH} caracteres.` : `At least ${MIN_PASSWORD_LENGTH} characters.`}</span></label>
        <StateMessage state={state} />
        <SubmitButton en="Create account" es="Crear cuenta" />
      </form>
      <p className="text-sm text-[var(--cma-text-secondary)]">{language === "es" ? "¿Ya tenés cuenta?" : "Already have an account?"} <Link href={`/auth/login?next=${encodeURIComponent(next)}`} className="font-semibold text-[var(--cma-accent-cyan)] hover:underline">{language === "es" ? "Iniciar sesión" : "Sign in"}</Link></p>
    </div>
  );
}

export function ForgotPasswordForm() {
  const { language } = useLanguage();
  const [state, action] = useActionState(requestPasswordResetAction, initialAuthState);
  return (
    <form action={action} className="space-y-4">
      <label className={labelClass}>Email<input className={inputClass} type="email" name="email" autoComplete="email" required /></label>
      <StateMessage state={state} />
      <SubmitButton en="Send recovery link" es="Enviar enlace de recuperación" />
      <Link href="/auth/login" className="inline-flex text-sm font-semibold text-[var(--cma-accent-cyan)] hover:underline">{language === "es" ? "Volver al inicio de sesión" : "Back to sign in"}</Link>
    </form>
  );
}

export function UpdatePasswordForm() {
  const { language } = useLanguage();
  const [state, action] = useActionState(updatePasswordAction, initialAuthState);
  return (
    <form action={action} className="space-y-4">
      <label className={labelClass}>{language === "es" ? "Nueva contraseña" : "New password"}<input className={inputClass} type="password" name="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required /></label>
      <label className={labelClass}>{language === "es" ? "Repetir contraseña" : "Repeat password"}<input className={inputClass} type="password" name="passwordConfirmation" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required /></label>
      <StateMessage state={state} />
      <SubmitButton en="Update password" es="Actualizar contraseña" />
    </form>
  );
}

export function ProfileForm({ displayName }: { displayName: string }) {
  const { language } = useLanguage();
  const [state, action] = useActionState(updateProfileAction, initialAuthState);
  return (
    <form action={action} className="space-y-4">
      <label className={labelClass}>{language === "es" ? "Nombre visible" : "Display name"}<input className={inputClass} name="displayName" defaultValue={displayName} minLength={2} maxLength={80} required /></label>
      <StateMessage state={state} />
      <SubmitButton en="Save profile" es="Guardar perfil" />
    </form>
  );
}
