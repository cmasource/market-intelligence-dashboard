import { ProviderError } from "./base";

type BymaTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

function bymaBaseUrl() {
  return process.env.BYMA_BASE_URL?.trim() || "https://apigw.byma.com.ar";
}

function bymaScope() {
  return process.env.BYMA_SCOPE?.trim() || "snapshot.read eod.read delay20.read";
}

function legacyApiKey() {
  return process.env.BYMA_API_KEY?.trim() ?? "";
}

export function hasBymaOAuthCredentials() {
  return Boolean(process.env.BYMA_CLIENT_ID?.trim() && process.env.BYMA_CLIENT_SECRET?.trim());
}

export async function getBymaToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.accessToken;

  const clientId = process.env.BYMA_CLIENT_ID?.trim();
  const clientSecret = process.env.BYMA_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    const key = legacyApiKey();
    if (key) return key;
    throw new ProviderError("byma", "Faltan BYMA_CLIENT_ID y BYMA_CLIENT_SECRET para OAuth Client Credentials.", {
      missingEnv: !clientId ? "BYMA_CLIENT_ID" : "BYMA_CLIENT_SECRET",
    });
  }

  const url = new URL("/oauth/token/", bymaBaseUrl());
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: bymaScope(),
  });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await response.json().catch(() => ({})) as BymaTokenResponse;

  if (!response.ok || !data.access_token) {
    throw new ProviderError("byma", bymaAuthErrorMessage(response.status, data), { statusCode: response.status });
  }

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + Math.max(60, data.expires_in ?? 300) * 1000,
  };

  return cachedToken.accessToken;
}

export async function getBymaAuthorizationHeader() {
  return { Authorization: `Bearer ${await getBymaToken()}` };
}

function bymaAuthErrorMessage(status: number, data: BymaTokenResponse) {
  const providerMessage = data.error_description ?? data.error;
  if (status === 401) return `BYMA OAuth rechazo credenciales client credentials.${providerMessage ? ` ${providerMessage}` : ""}`;
  if (status === 403) return `BYMA OAuth no autorizo el scope solicitado.${providerMessage ? ` ${providerMessage}` : ""}`;
  return `BYMA OAuth token request failed with HTTP ${status}.${providerMessage ? ` ${providerMessage}` : ""}`;
}
