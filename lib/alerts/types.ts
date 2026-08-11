import type { OhlcvBar, TradeRadarProviderName } from "@/lib/market-data/providers/base";

export type AlertSeverity = "informational" | "low" | "medium" | "high" | "critical";
export type AlertCategory =
  | "unusual_price_move"
  | "unusual_volume"
  | "trend_change"
  | "elevated_volatility"
  | "technical_change"
  | "opportunity"
  | "bond_event"
  | "corporate_bond_event"
  | "material_news"
  | "arbitrage_opportunity";
export type AlertDirection = "up" | "down" | "neutral";
export type AlertStatus = "active" | "resolved" | "expired" | "dismissed";
export type PersonalAlertCondition =
  | "price_above"
  | "price_below"
  | "rapid_rise"
  | "rapid_fall"
  | "near_ema200"
  | "near_period_low"
  | "near_period_high";
export type AlertAssetType =
  | "stock"
  | "etf"
  | "adr"
  | "cedear"
  | "cedear_etf"
  | "crypto"
  | "bond"
  | "bill"
  | "corporate_bond"
  | "other";

export type AlertEvidence = {
  key: string;
  label: string;
  value: string | number;
  unit?: string;
  provider: string;
  observedAt: string;
};
export type AlertMarketSnapshot = {
  instrumentId: string;
  symbol: string;
  name: string;
  assetType: AlertAssetType;
  market: string;
  exchange?: string;
  currency: string;
  provider: Exclude<TradeRadarProviderName, "auto">;
  providerHealthy: boolean;
  observedAt: string;
  fetchedAt: string;
  dataDelay: "realtime" | "delayed" | "eod" | "unknown";
  bars: OhlcvBar[];
};

export type PersonalAlertQuoteContext = {
  price: number | null;
  previousObservedPrice: number | null;
  changePercent: number | null;
  provider: string;
  observedAt: string | null;
  fetchedAt: string;
  dataDelay: "realtime" | "delayed" | "eod" | "unknown";
};

export type AlertEvaluation = {
  ruleId: string;
  ruleVersion: number;
  category: AlertCategory;
  triggered: boolean;
  severity: AlertSeverity;
  confidenceScore: number;
  direction: AlertDirection;
  title: { es: string; en: string };
  summary: { es: string; en: string };
  reasons: string[];
  evidence: AlertEvidence[];
  limitations: string[];
  evaluatedAt: string;
  freshnessStatus: "fresh" | "stale" | "invalid";
};

export type AlertRuleDefinition = {
  id: string;
  version: number;
  name: string;
  category: AlertCategory;
  supportedAssetTypes: AlertAssetType[];
  enabled: boolean;
  scope: "automatic" | "personal";
  description: string;
  requiredData: string[];
  cooldownMinutes: number;
  limitations: string[];
  createdAt: string;
  updatedAt: string;
};

export type AlertPreferences = {
  alertsEnabled: boolean;
  minimumSeverity: AlertSeverity;
  frequency: "immediate" | "hourly_digest" | "daily_digest" | "disabled";
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timezone: string;
  opportunityAlertsEnabled: boolean;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  whatsappPhoneE164: string | null;
  monitoredWatchlistIds: string[] | null;
};

export const severityRank: Record<AlertSeverity, number> = {
  informational: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export type PersonalAlertSubscription = {
  id: string;
  userId: string;
  watchlistId: string;
  watchlistItemId: string;
  instrumentId: string;
  instrumentSymbol: string;
  instrumentName: string;
  market: string;
  exchange: string | null;
  currency: string;
  assetType: AlertAssetType;
  condition: PersonalAlertCondition;
  targetValue: number | null;
  thresholdPercent: number | null;
  lookbackBars: number | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ArbitrageAlertSubscription = {
  id: string;
  userId: string;
  scope: "route" | "any_verified";
  sourceProviderId: string | null;
  destinationProviderId: string | null;
  transferAsset: "USD_BANK" | "USDT" | "USDC";
  amountUsd: number;
  minimumGrossSpreadArs: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};
