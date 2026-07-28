"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { safeRedirectPath } from "@/lib/auth/redirects";
import {
  isValidEmail,
  normalizeDisplayName,
  normalizeEmail,
  validatePassword,
} from "@/lib/auth/validation";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  status: "idle" | "error" | "success";
  code?: string;
};

function configurationError(): AuthActionState {
  return { status: "error", code: "configuration_missing" };
}

async function requestOrigin() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredSiteUrl) return configuredSiteUrl.replace(/\/$/, "");

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  if (origin?.startsWith("http://") || origin?.startsWith("https://")) return origin;

  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function signInAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!getSupabaseConfig()) return configurationError();
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const next = safeRedirectPath(String(formData.get("next") ?? ""));

  if (!isValidEmail(email) || !password) return { status: "error", code: "invalid_form" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { status: "error", code: error.code ?? "invalid_credentials" };

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUpAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!getSupabaseConfig()) return configurationError();
  const email = normalizeEmail(formData.get("email"));
  const password = validatePassword(formData.get("password"));
  const displayName = normalizeDisplayName(formData.get("displayName"));
  const next = safeRedirectPath(String(formData.get("next") ?? ""));

  if (!isValidEmail(email) || !password || !displayName) return { status: "error", code: "invalid_form" };

  const origin = await requestOrigin();
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", next);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: callbackUrl.toString(),
      data: { full_name: displayName },
    },
  });

  if (error) return { status: "error", code: error.code ?? "signup_failed" };
  if (data.session) {
    revalidatePath("/", "layout");
    redirect(next);
  }

  return { status: "success", code: "confirmation_sent" };
}

export async function requestPasswordResetAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!getSupabaseConfig()) return configurationError();
  const email = normalizeEmail(formData.get("email"));
  if (!isValidEmail(email)) return { status: "error", code: "invalid_form" };

  const origin = await requestOrigin();
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", "/auth/update-password");

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl.toString(),
  });
  if (error) return { status: "error", code: error.code ?? "reset_failed" };

  return { status: "success", code: "recovery_sent" };
}

export async function updatePasswordAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!getSupabaseConfig()) return configurationError();
  const password = validatePassword(formData.get("password"));
  const confirmation = String(formData.get("passwordConfirmation") ?? "");
  if (!password || password !== confirmation) return { status: "error", code: "password_mismatch" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { status: "error", code: error.code ?? "password_update_failed" };

  revalidatePath("/", "layout");
  redirect("/account?updated=password");
}

export async function updateProfileAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!getSupabaseConfig()) return configurationError();
  const displayName = normalizeDisplayName(formData.get("displayName"));
  if (!displayName) return { status: "error", code: "invalid_name" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ data: { full_name: displayName } });
  if (error) return { status: "error", code: error.code ?? "profile_update_failed" };

  revalidatePath("/account");
  return { status: "success", code: "profile_updated" };
}

export async function signOutAction() {
  if (getSupabaseConfig()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/");
}
