import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseConfig } from "./config";

let browserClient: SupabaseClient | null = null;

export function createClient() {
  if (!browserClient) {
    const { url, publishableKey } = requireSupabaseConfig();
    browserClient = createBrowserClient(url, publishableKey);
  }
  return browserClient;
}

