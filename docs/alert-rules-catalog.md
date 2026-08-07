# Alert rules catalog

The code source of truth is `lib/alerts/rules.ts`; evaluation logic is in `lib/alerts/engine.ts`. All thresholds compare an instrument with its own history. These rules are implemented but have not been historically validated or calibrated for investment outcomes.

The integration with the current `main` branch did not change thresholds, enable new categories, or connect Radar de Arbitraje. Rule evaluation becomes operational only after the Supabase migration, server credentials, one scheduler strategy, and the documented live validations are completed.

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
| `arbitrage_opportunity` | 1 | Disabled placeholder | None | None | 60 min | Outside this phase and disconnected from Radar de Arbitraje |

## Personal rules

| Rule | User setting | Trigger | Main limitation |
| --- | --- | --- | --- |
| `personal_price_above` | Target price | Latest daily close crosses from below to at/above the target | Evaluated on closing data, not intraday ticks |
| `personal_price_below` | Target price | Latest daily close crosses from above to at/below the target | Evaluated on closing data, not intraday ticks |
| `personal_rapid_rise` | Percentage | Latest close-to-close return is at least the configured percentage | One daily bar; no intraday interpretation |
| `personal_rapid_fall` | Percentage | Latest close-to-close loss is at least the configured percentage | One daily bar; no intraday interpretation |
| `personal_near_ema200` | Proximity percentage | Latest close is within the configured percentage of EMA 200 | Requires at least 200 usable closes |
| `personal_near_period_low` | Proximity and 20/60/120/200 sessions | Latest close is within the configured percentage of the prior period low | Period low, not all-time historical floor |
| `personal_near_period_high` | Proximity and 20/60/120/200 sessions | Latest close is within the configured percentage of the prior period high | Period high, not all-time historical ceiling |

All enabled automatic and personal rules require a healthy provider response, fresh timestamps, normalized OHLCV, and the scheduler's 220-candle minimum. Evidence persists the observed value, unit, provider, and observation time. Confidence is capped below 1 and is used only for filtering/prioritization.
