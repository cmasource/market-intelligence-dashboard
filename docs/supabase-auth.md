# Supabase Auth foundation

## Scope

This phase adds email/password registration and sign-in, email confirmation, password recovery and update, Google OAuth with PKCE, sign-out, cookie-backed session refresh, basic Auth metadata, and the private `/account` route.

Watchlists remain browser-local. Authentication does not read, write, import, delete, or synchronize watchlist `localStorage` data. No portfolio, position, alert, role, advisor, admin, or cross-device schema is included.

## Project configuration

Create or select one Supabase project and configure these public values locally and in Vercel Preview and Production:

```text
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=https://<canonical-app-domain>
```

The legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` is accepted as a compatibility fallback, but the publishable key is preferred. Never expose a secret key or `service_role` key through a `NEXT_PUBLIC_` variable.

In Supabase Auth URL Configuration:

1. Set the production domain as Site URL.
2. Add the exact local callback URL, for example `http://localhost:3000/auth/callback`.
3. Add the production callback URL: `https://<canonical-app-domain>/auth/callback`.
4. Add each Preview callback origin that will be used for authentication. Prefer explicit trusted preview domains over a broad wildcard.

Email confirmation should remain enabled. Supabase's default mailer is suitable only for initial testing and is rate-limited; configure custom SMTP before production use.

## Google provider

1. Create a Web OAuth client in Google Auth Platform.
2. Add the app's trusted origins in Google.
3. Add the Supabase provider callback shown in the Supabase dashboard as an authorized Google redirect URI. It normally has the form `https://<project-ref>.supabase.co/auth/v1/callback`.
4. Store the Google Client ID and Client Secret in the Supabase Google provider settings, not in this repository.
5. Enable Google in Supabase Auth Providers.

The app sends Google back to `/auth/callback`, where `exchangeCodeForSession` completes PKCE and stores the Supabase session in cookies.

## Session and route security

- `lib/supabase/client.ts` lazily creates the browser client.
- `lib/supabase/server.ts` creates a new server client per request and uses async Next.js cookies.
- `proxy.ts` refreshes/validates claims and writes refreshed cookies plus the anti-cache response headers supplied by `@supabase/ssr`.
- `/account` is optimistically redirected by Proxy and independently validates the current user with `auth.getUser()` in its Server Component.
- Auth callbacks and login return paths accept only same-origin relative destinations to prevent open redirects.

No database table or SQL migration is required for this phase. The display name is stored in Supabase Auth user metadata and is not used for authorization.

## Verification

Without Supabase credentials, the public auth pages render a configuration-pending message and `/account` redirects to `/auth/login?next=%2Faccount`.

Run:

```bash
npm run lint
npm run test:auth
npm run build
npm run test:e2e
```

After configuring Supabase, manually verify registration email delivery, confirmation, password recovery, Google consent, session persistence after reload, sign-out, and returning to `/account` after login.
