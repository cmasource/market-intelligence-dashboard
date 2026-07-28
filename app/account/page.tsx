import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountContent } from "@/components/auth/AccountContent";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Account | CMA Markets", robots: { index: false, follow: false } };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ updated?: string }> }) {
  if (!getSupabaseConfig()) redirect("/auth/login?next=%2Faccount");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/auth/login?next=%2Faccount");

  const params = await searchParams;
  const user = data.user;
  const displayName = typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : "";
  const provider = user.app_metadata.provider === "google" ? "google" : "email";

  return (
    <AccountContent
      email={user.email ?? ""}
      displayName={displayName}
      provider={provider}
      createdAt={user.created_at}
      passwordUpdated={params.updated === "password"}
    />
  );
}
