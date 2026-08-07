import type { Metadata } from "next";
import { AlertDetail } from "@/components/alerts/AlertDetail";
import { AlertsAccessState } from "@/components/alerts/AlertsAccessState";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Alert detail | CMA Markets", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AlertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!getSupabaseConfig()) return <AlertsAccessState configured={false} />;
  const { data } = await (await createClient()).auth.getUser();
  if (!data.user) return <AlertsAccessState configured />;
  return <AlertDetail id={(await params).id} />;
}
