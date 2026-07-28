import { NextResponse } from "next/server";
import { safeRedirectPath } from "@/lib/auth/redirects";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeRedirectPath(requestUrl.searchParams.get("next"));

  if (!code || !getSupabaseConfig()) {
    return NextResponse.redirect(new URL("/auth/error?reason=invalid_callback", requestUrl.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/auth/error?reason=code_exchange", requestUrl.origin));
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProtocol = request.headers.get("x-forwarded-proto") ?? "https";
  const origin = process.env.NODE_ENV === "development" || !forwardedHost
    ? requestUrl.origin
    : `${forwardedProtocol}://${forwardedHost}`;

  return NextResponse.redirect(new URL(next, origin));
}

