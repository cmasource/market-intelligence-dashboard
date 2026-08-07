import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AlertPreferencesForm } from "@/components/alerts/AlertPreferencesForm";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Alert settings | CMA Markets", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AlertSettingsPage() {
  if (!getSupabaseConfig()) redirect("/auth/login?next=%2Faccount%2Falerts");
  const { data } = await (await createClient()).auth.getUser();
  if (!data.user) redirect("/auth/login?next=%2Faccount%2Falerts");
  return <AlertPreferencesForm />;
}
