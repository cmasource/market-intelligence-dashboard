import { alphaVantageProvider } from "./providers/alphaVantage";
import { binanceProvider } from "./providers/binance";
import { bymaProvider, getBymaLocalQuote } from "./providers/byma";
import { fmpRadarProvider } from "./providers/fmp";
import { twelveDataProvider } from "./providers/twelveData";
import { yahooRadarProvider } from "./providers/yahoo";
import { getTradeRadarProviderStatus } from "./trade-radar-provider-status";
import {
  ProviderError,
  type ProviderFailure,
  type ProviderRequest,
  type ProviderResponse,
  type TradeRadarProviderName,
} from "./providers/base";
import type { ResolvedTradeRadarSymbol } from "./resolveSymbol";

const providers = {
  yahoo: yahooRadarProvider,
  twelveData: twelveDataProvider,
  alphaVantage: alphaVantageProvider,
  fmp: fmpRadarProvider,
  byma: bymaProvider,
  binance: binanceProvider,
};

function providerFailure(error: unknown, provider: Exclude<TradeRadarProviderName, "auto">): ProviderFailure {
  if (error instanceof ProviderError) {
    return {
      provider: error.provider,
      message: error.message,
      missingEnv: error.missingEnv,
      statusCode: error.statusCode,
    };
  }

  return {
    provider,
    message: error instanceof Error ? error.message : `${provider} request failed.`,
  };
}

function missingFailure(provider: ProviderFailure["provider"], missingEnv: string): ProviderFailure {
  return {
    provider,
    message: `Missing ${missingEnv}.`,
    missingEnv,
  };
}

function isForbidden(failure: ProviderFailure) {
  return failure.statusCode === 403 || failure.statusCode === 402;
}

function priorityFor(requestedProvider: TradeRadarProviderName, market: ProviderRequest["market"]) {
  if (requestedProvider !== "auto") return [requestedProvider];
  if (market === "crypto") return ["binance"] satisfies TradeRadarProviderName[];
  if (market === "bond") return ["byma"] satisfies TradeRadarProviderName[];
  if (market === "argentina") return ["yahoo", "byma"] satisfies TradeRadarProviderName[];
  if (market === "cedear") return ["yahoo", "twelveData", "alphaVantage", "fmp", "byma"] satisfies TradeRadarProviderName[];
  return ["yahoo", "twelveData", "alphaVantage", "fmp"] satisfies TradeRadarProviderName[];
}

function autoProviderPlan(market: ProviderRequest["market"], failures: ProviderFailure[]) {
  const status = getTradeRadarProviderStatus();
  const priority = priorityFor("auto", market);

  return priority.filter((provider) => {
    if (provider === "twelveData" && !status.hasTwelveDataKey) {
      failures.push(missingFailure("twelveData", "TWELVE_DATA_API_KEY"));
      return false;
    }
    if (provider === "alphaVantage" && !status.hasAlphaVantageKey) {
      failures.push(missingFailure("alphaVantage", "ALPHA_VANTAGE_API_KEY"));
      return false;
    }
    if (provider === "fmp" && !status.hasFmpKey) {
      failures.push(missingFailure("fmp", "FMP_API_KEY"));
      return false;
    }
    if (provider === "byma" && !status.hasBymaKey) {
      failures.push(missingFailure("byma", "BYMA_API_KEY"));
      return false;
    }
    return true;
  });
}

export function formatProviderUnavailableMessage(
  market: ProviderRequest["market"],
  failures: ProviderFailure[],
  requestedProvider: TradeRadarProviderName,
) {
  const fmpForbidden = failures.find((failure) => failure.provider === "fmp" && isForbidden(failure));
  const missingTwelve = failures.some((failure) => failure.missingEnv === "TWELVE_DATA_API_KEY");
  const missingAlpha = failures.some((failure) => failure.missingEnv === "ALPHA_VANTAGE_API_KEY");

  if (market === "us" && requestedProvider === "auto") {
    const setupText = missingTwelve && missingAlpha
      ? "Configurar TWELVE_DATA_API_KEY o ALPHA_VANTAGE_API_KEY en .env.local y reiniciar el servidor."
      : "Revisar disponibilidad de Twelve Data o Alpha Vantage para OHLCV.";
    const fmpText = fmpForbidden
      ? " FMP respondio 403, por lo que se omitio como proveedor de respaldo."
      : failures.some((failure) => failure.provider === "fmp")
        ? ` FMP no entrego OHLCV util: ${failures.find((failure) => failure.provider === "fmp")?.message}`
        : "";

    return `No hay proveedor OHLCV disponible para acciones US. ${setupText}${fmpText}`;
  }

  if ((market === "argentina" || market === "bond") && failures.some((failure) => failure.provider === "byma")) {
    return "BYMA no esta disponible para cotizacion local. Configurar BYMA_CLIENT_ID, BYMA_CLIENT_SECRET, BYMA_SCOPE y BYMA_BASE_URL. No se calculan indicadores sin historico OHLCV suficiente.";
  }

  return failures.map((failure) => `${failure.provider}: ${failure.message}`).join(" | ") || "No provider returned usable OHLCV data.";
}

export async function fetchBymaCedearLocalQuote(symbol: string) {
  return fetchBymaInstrumentLocalQuote(symbol, "CEDEARS");
}

export async function fetchBymaInstrumentLocalQuote(symbol: string, group: "ACCIONES" | "CEDEARS" = "ACCIONES") {
  const status = getTradeRadarProviderStatus();
  if (!status.hasBymaKey) return { quote: null, failure: missingFailure("byma", "BYMA_CLIENT_ID/BYMA_CLIENT_SECRET") };

  try {
    return { quote: await getBymaLocalQuote(symbol, { group }), failure: null };
  } catch (error) {
    return { quote: null, failure: providerFailure(error, "byma") };
  }
}

export async function fetchTradeRadarOhlcv(
  resolved: ResolvedTradeRadarSymbol,
  interval: ProviderRequest["interval"],
  requestedProvider: TradeRadarProviderName,
): Promise<{ response: ProviderResponse; failures: ProviderFailure[] }> {
  const failures: ProviderFailure[] = [];
  const marketForProvider = resolved.market === "cedear" ? "us" : resolved.market;
  const request: ProviderRequest = {
    symbol: resolved.resolvedSymbol,
    market: marketForProvider,
    interval,
  };
  const providerPlan = requestedProvider === "auto"
    ? autoProviderPlan(resolved.market, failures)
    : priorityFor(requestedProvider, resolved.market);

  for (const providerName of providerPlan) {
    const provider = providers[providerName];
    try {
      const response = await provider.getOhlcv(request);
      return {
        response: {
          ...response,
          symbol: resolved.inputSymbol,
          market: resolved.market,
        },
        failures,
      };
    } catch (error) {
      const failure = providerFailure(error, providerName);
      failures.push(failure);
      if (providerName === "fmp" && isForbidden(failure)) continue;
    }
  }

  const details = formatProviderUnavailableMessage(request.market, failures, requestedProvider);
  throw new ProviderError(
    requestedProvider === "auto" ? failures[0]?.provider ?? "yahoo" : requestedProvider,
    details || "No provider returned usable OHLCV data.",
  );
}
