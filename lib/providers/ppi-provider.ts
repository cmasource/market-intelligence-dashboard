const SANDBOX_BASE_URL = "https://clientapi_sandbox.portfoliopersonal.com";
const PRODUCTION_BASE_URL = "https://clientapi.portfoliopersonal.com";
const API_VERSION = "1.0";
const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

type TokenResponse = {
  accessToken?: string;
  expirationDate?: string;
};

type PpiEnvironment = "sandbox" | "production";

type PpiConfig = {
  apiKey: string;
  apiSecret: string;
  clientKey: string;
  authorizedClient: string;
};

type PpiRuntimeError = {
  stage: "config" | "login" | "request";
  status?: number;
  message: string;
};

export type PpiRuntimeStatus = {
  configured: boolean;
  environment: PpiEnvironment;
  baseUrl: string;
  usingOverrideBaseUrl: boolean;
  missingVariables: string[];
  unavailableUntil: string | null;
  lastError: PpiRuntimeError | null;
};

export type PpiInstrumentType = "ACCIONES" | "CEDEARS" | "BONOS" | "LETRAS" | "ON";
export type PpiSettlement = "INMEDIATA" | "A-24HS";

export type PpiMarketBar = {
  date?: string;
  price?: number;
  volume?: number;
  openingPrice?: number;
  previousClose?: number;
  marketChange?: number;
  marketChangePercent?: number | string;
  max?: number;
  min?: number;
};

let cachedToken: { accessToken: string; expiresAt: number } | null = null;
let unavailableUntil = 0;
let lastError: PpiRuntimeError | null = null;

function getEnvironment(): PpiEnvironment {
  const raw = process.env.PPI_ENV?.trim().toLowerCase();
  if (raw === "prod" || raw === "production") return "production";
  return "sandbox";
}

function getBaseUrl(environment = getEnvironment()) {
  return process.env.PPI_BASE_URL?.trim()
    || (environment === "production" ? PRODUCTION_BASE_URL : SANDBOX_BASE_URL);
}

function getVariableNames(environment = getEnvironment()) {
  return environment === "production"
    ? {
        apiKey: "PPI_PROD_API_KEY",
        apiSecret: "PPI_PROD_API_SECRET",
        clientKey: "PPI_PROD_CLIENT_KEY",
        authorizedClient: "PPI_PROD_AUTHORIZED_CLIENT",
      }
    : {
        apiKey: "PPI_API_KEY",
        apiSecret: "PPI_API_SECRET",
        clientKey: "PPI_CLIENT_KEY",
        authorizedClient: "PPI_AUTHORIZED_CLIENT",
      };
}

function readEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

function getRequestTimeoutMs() {
  const value = Number(process.env.PPI_TIMEOUT_MS);
  return Number.isFinite(value) && value >= 1_000 ? value : DEFAULT_REQUEST_TIMEOUT_MS;
}

function getConfig(environment = getEnvironment()): PpiConfig {
  const names = getVariableNames(environment);
  return {
    apiKey: readEnv(names.apiKey),
    apiSecret: readEnv(names.apiSecret),
    clientKey: readEnv(names.clientKey),
    authorizedClient: readEnv(names.authorizedClient),
  };
}

function getMissingVariables(environment = getEnvironment()) {
  const names = getVariableNames(environment);
  const config = getConfig(environment);
  return [
    [names.apiKey, config.apiKey],
    [names.apiSecret, config.apiSecret],
    [names.clientKey, config.clientKey],
    [names.authorizedClient, config.authorizedClient],
  ].flatMap(([name, value]) => (value ? [] : [name]));
}

export function getPpiRuntimeStatus(): PpiRuntimeStatus {
  const environment = getEnvironment();
  const missingVariables = getMissingVariables(environment);
  const configured = missingVariables.length === 0;

  return {
    configured,
    environment,
    baseUrl: getBaseUrl(environment),
    usingOverrideBaseUrl: Boolean(process.env.PPI_BASE_URL?.trim()),
    missingVariables,
    unavailableUntil: unavailableUntil > Date.now() ? new Date(unavailableUntil).toISOString() : null,
    lastError: configured
      ? lastError
      : {
          stage: "config",
          message: `Missing PPI environment variables: ${missingVariables.join(", ")}`,
        },
  };
}

export function isPpiConfigured() {
  return getPpiRuntimeStatus().configured;
}

function parseTokenResponse(payload: unknown): TokenResponse {
  const value = Array.isArray(payload) ? payload[0] : payload;
  if (!value || typeof value !== "object") return {};
  return value as TokenResponse;
}

async function login() {
  const config = getConfig();
  if (!isPpiConfigured()) {
    lastError = getPpiRuntimeStatus().lastError;
    return null;
  }
  if (Date.now() < unavailableUntil) return null;

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/api/${API_VERSION}/Account/LoginApi`, {
      method: "POST",
      headers: {
        AuthorizedClient: config.authorizedClient,
        ClientKey: config.clientKey,
        ApiKey: config.apiKey,
        ApiSecret: config.apiSecret,
      },
      signal: AbortSignal.timeout(getRequestTimeoutMs()),
    });
  } catch (error) {
    lastError = {
      stage: "login",
      message: error instanceof Error ? error.message : "PPI login request failed",
    };
    unavailableUntil = Date.now() + 60_000;
    return null;
  }

  if (!response.ok) {
    unavailableUntil = Date.now() + (response.status === 429 ? 5 * 60_000 : 60_000);
    lastError = {
      stage: "login",
      status: response.status,
      message: `PPI login returned HTTP ${response.status}`,
    };
    return null;
  }
  const token = parseTokenResponse(await response.json());
  if (!token.accessToken) {
    lastError = {
      stage: "login",
      message: "PPI login response did not include an access token",
    };
    return null;
  }

  cachedToken = {
    accessToken: token.accessToken,
    expiresAt: token.expirationDate ? new Date(token.expirationDate).getTime() : Date.now() + 15 * 60_000,
  };
  lastError = null;

  return cachedToken.accessToken;
}

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.accessToken;
  return login();
}

async function authorizedGet<T>(path: string, params: Record<string, string>) {
  const token = await getAccessToken();
  if (!token) return null;
  const config = getConfig();

  const url = new URL(`${getBaseUrl()}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        AuthorizedClient: config.authorizedClient,
        ClientKey: config.clientKey,
      },
      signal: AbortSignal.timeout(getRequestTimeoutMs()),
      next: { revalidate: 30 },
    });
  } catch (error) {
    lastError = {
      stage: "request",
      message: error instanceof Error ? error.message : `PPI request failed for ${path}`,
    };
    return null;
  }

  if (!response.ok) {
    if (response.status === 429) unavailableUntil = Date.now() + 5 * 60_000;
    lastError = {
      stage: "request",
      status: response.status,
      message: `PPI ${path} returned HTTP ${response.status}`,
    };
    return null;
  }
  try {
    const payload = (await response.json()) as T;
    lastError = null;
    return payload;
  } catch (error) {
    lastError = {
      stage: "request",
      message: error instanceof Error ? error.message : `PPI response parse failed for ${path}`,
    };
    return null;
  }
}

export function getPpiCurrentQuote(input: {
  ticker: string;
  type: PpiInstrumentType;
  settlement?: PpiSettlement;
}) {
  return authorizedGet<PpiMarketBar>(`/api/${API_VERSION}/MarketData/Current`, {
    Ticker: input.ticker,
    Type: input.type,
    Settlement: input.settlement ?? "A-24HS",
  });
}
