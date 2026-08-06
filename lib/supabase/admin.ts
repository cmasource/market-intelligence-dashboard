import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serverSecret = process.env.SUPABASE_SECRET_KEY?.trim()
    || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serverSecret) {
    throw new Error("Alert scheduler is not configured. Supabase URL and a server-only secret key are required.");
  }
  return createClient(url, serverSecret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
