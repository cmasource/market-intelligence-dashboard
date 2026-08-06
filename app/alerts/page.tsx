import type { Metadata } from "next";
import { AlertsAccessState } from "@/components/alerts/AlertsAccessState";
import { AlertsCenter } from "@/components/alerts/AlertsCenter";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Alerts | CMA Markets", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  if (!getSupabaseConfig()) return <AlertsAccessState configured={false} />;
  const { data } = await (await createClient()).auth.getUser();
  if (!data.user) return <AlertsAccessState configured />;
  return <AlertsCenter />;
}

