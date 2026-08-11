# Alert rules catalog

The code source of truth is `lib/alerts/rules.ts`; evaluation logic is in `lib/alerts/engine.ts`. All thresholds compare an instrument with its own history. These rules are implemented but have not been historically validated or calibrated for investment outcomes.

The Radar de Arbitraje integration uses the same delivery, deduplication, cooldown, and lifecycle engine. It remains separate from technical watchlist rules and uses deterministic quote/route verification rather than OHLCV indicators.

| Rule | Version | Status | Supported instruments | Trigger | Cooldown | Main limitation |
| --- | ---: | --- | --- | --- | ---: | --- |
| `unusual_price_move` | 1 | Enabled | Stock, ETF, ADR, CEDEAR, CEDEAR ETF, crypto | Absolute latest return exceeds both 2.5 times recent return deviation and 1.5 ATR-equivalent threshold | 360 min | No market/sector context yet |
| `unusual_volume` | 1 | Enabled | Same technical universe | Latest positive volume is at least 2.2 times the prior 20-bar average, with at least 16 usable observations | 360 min | Disabled when volume is absent/unusable |
| `trend_change` | 1 | Enabled | Same technical universe | Confirmed EMA50 cross or 20-bar range break with 0.15 ATR buffer | 720 min | Technical event, not an order |
| `elevated_volatility` | 1 | Enabled | Same technical universe | 10-bar realized volatility is at least 1.8 times the preceding 40-bar baseline | 720 min | No directional forecast |
| `multi_signal_opportunity` | 1 | Enabled, user-optional | Same technical universe | Upward trend event plus independent non-negative unusual price or volume event | 1440 min | “Opportunity” is a review priority, not expected profit |
| `material_news` | 1 | Disabled | Technical universe | Not implemented until an attributable licensed source exists | 720 min | Source unavailable |
| `bond_event` | 1 | Disabled | Sovereign/CER bonds and bills | Reserved for verified price, cash-flow, yield and liquidity data | 1440 min | Current coverage incomplete/mock |
| `corporate_bond_event` | 1 | Disabled | Corporate bonds/ONs | Reserved for verified issuer, cash-flow, yield and event data | 1440 min | Source unavailable |
| `arbitrage_opportunity` | 3 | Enabled, user-configurable | USD bank, USDT or USDC provider routes | A route exceeds the configured per-unit threshold and passes fresh timestamps, verified quotes, costs, limits, transfer compatibility and positive net-result checks | 60 min | Verification reflects the latest available provider evidence and does not guarantee execution |

## Personal rules

| Rule | User setting | Trigger | Main limitation |
| --- | --- | --- | --- |
| `personal_price_above` | Target price | Current observed quote crosses from below to at/above the target | Requires two fresh observations; the first seeds state |
| `personal_price_below` | Target price | Current observed quote crosses from above to at/below the target | Requires two fresh observations; the first seeds state |
| `personal_rapid_rise` | Percentage | Provider current-session change is at least the configured percentage | Depends on the provider's prior-close comparison |
| `personal_rapid_fall` | Percentage | Provider current-session loss is at least the configured percentage | Depends on the provider's prior-close comparison |
| `personal_near_ema200` | Proximity percentage | Current quote is within the configured percentage of daily EMA 200 | Requires at least 200 usable daily closes |
| `personal_near_period_low` | Proximity and 20/60/120/200 sessions | Current quote is within the configured percentage of the prior daily period low | Period low, not all-time historical floor |
| `personal_near_period_high` | Proximity and 20/60/120/200 sessions | Current quote is within the configured percentage of the prior daily period high | Period high, not all-time historical ceiling |

Automatic rules require a healthy provider response, fresh timestamps, normalized daily OHLCV, and the scheduler's 220-candle minimum. Personal rules require the same daily reference history plus a fresh non-EOD current quote. Evidence persists the observed value, unit, provider, and observation time. Confidence is capped below 1 and is used only for filtering/prioritization.
