import assert from "node:assert/strict";
import test from "node:test";
import {
  describePersonalAlert,
  personalAlertConditionCopy,
  personalAlertSchedule,
} from "../../lib/alerts/presentation";
import type { PersonalAlertSubscription } from "../../lib/alerts/types";

function subscription(overrides: Partial<PersonalAlertSubscription> = {}): PersonalAlertSubscription {
  return {
    id: "alert-1", userId: "user-1", watchlistId: "list-1", watchlistItemId: "item-1",
    instrumentId: "stock:MSFT", instrumentSymbol: "MSFT", instrumentName: "Microsoft Corporation",
    market: "us", exchange: "NASDAQ", currency: "USD", assetType: "stock", condition: "near_ema200",
    targetValue: null, thresholdPercent: 1, lookbackBars: null, enabled: true,
    createdAt: "2026-08-08T00:00:00.000Z", updatedAt: "2026-08-08T00:00:00.000Z",
    ...overrides,
  };
}

test("EMA 200 copy explains that the configured value is a maximum distance", () => {
  const copy = personalAlertConditionCopy("near_ema200", "es");
  assert.equal(copy.inputLabel, "Distancia máxima a la EMA 200 (%)");
  assert.equal(copy.defaultValue, "1");
  assert.match(copy.example, /entre 495 y 505/);
  assert.match(describePersonalAlert(subscription(), "es"), /1 % o menos de la EMA 200/);
});

test("each threshold type has a distinct input label and sensible default", () => {
  assert.equal(personalAlertConditionCopy("price_above", "es").inputLabel, "Precio objetivo");
  assert.equal(personalAlertConditionCopy("price_above", "es").defaultValue, "");
  assert.equal(personalAlertConditionCopy("rapid_rise", "es").inputLabel, "Suba diaria mínima (%)");
  assert.equal(personalAlertConditionCopy("rapid_rise", "es").defaultValue, "5");
  assert.equal(personalAlertConditionCopy("near_period_low", "es").inputLabel, "Distancia máxima al mínimo (%)");
});

test("saved alert summaries state the complete trigger instead of an isolated percentage", () => {
  assert.equal(describePersonalAlert(subscription({ condition: "rapid_fall", thresholdPercent: 4 }), "es"), "El cierre diario cae 4 % o más");
  assert.equal(describePersonalAlert(subscription({ condition: "price_above", targetValue: 550, thresholdPercent: null }), "es"), "El cierre cruza por encima de 550 USD");
  assert.match(describePersonalAlert(subscription({ condition: "near_period_low", lookbackBars: 60 }), "es"), /mínimo de 60 ruedas/);
});

test("evaluation schedule is transparent by market", () => {
  assert.match(personalAlertSchedule("crypto", "crypto", "es"), /cada hora/);
  assert.match(personalAlertSchedule("cedear", "cedear", "es"), /18:00/);
  assert.match(personalAlertSchedule("stock", "us", "es"), /19:00/);
});
