# Intelligent alerts

## Objective and scope

This phase adds account-scoped, explainable alerts for instruments saved in CMA Market Intelligence watchlists. It is integrated into the existing App Router application at `/alerts`, `/alerts/[id]`, and `/account/alerts`; it reuses Supabase Auth, Instrument Master identities, Trade Radar OHLCV providers, the shared shell, themes, language context, and watchlist repository.

Alerts are informational. They never place orders, connect brokers, create positions or portfolios, estimate a guaranteed return, or provide personalized advice. Radar de Arbitraje contributes a separate deterministic opportunity rule while reusing the same account preferences and delivery channels.

## Initial diagnosis

- The repository uses Next.js 16.2 App Router, React 19, cookie-based `@supabase/ssr`, and root `proxy.ts`.
- Anonymous watchlists use versioned browser storage. Authenticated watchlists already had a partial `SupabaseWatchlistRepository` and the migration `20260804150000_account_watchlists.sql`.
- There was no notification store, rule catalog, job runner, transactional email provider, WhatsApp provider, or configured local Supabase environment.
- Trade Radar provides normalized OHLCV, provider identity, observed/fetched timestamps, delay, indicators, and a 220-candle sufficiency gate.
- Fixed-income pages currently disclose mock or incomplete data. News coverage does not provide the licensed material-event contract required for alerts. Those rules remain disabled.

## Architecture

```text
Local watchlists -- explicit consent --> account watchlists (Supabase + RLS)
                                             |
                         user-defined alert subscriptions
                                             |
5-minute scheduler --> protected Route Handler --> unique account instruments
                                             |
                         current quotes + daily Trade Radar OHLCV
                                             |
                         freshness + provider + sample validation
                                             |
                              versioned pure rule evaluations
                                             |
                  severity/preferences/deduplication/cooldown/lifecycle
                                             |
                          alert_events + alert_deliveries (in-app)
                                             |
                         center, unread count, detail, Trade Radar
```

Financial rules live in `lib/alerts/engine.ts` and `lib/alerts/rules.ts`; React components do not calculate indicators or determine severity. Inputs and outputs are deterministic and can be replayed for future calibration.

## Watchlist persistence and import

Anonymous users continue to use `cma-market-intelligence-watchlists-v2` in local storage. Authenticated users use `watchlists` and `watchlist_items`, protected by ownership RLS. The alert migration adds explicit instrument columns to `watchlist_items` while retaining the complete normalized item JSON for compatibility.

On the first authenticated visit with non-empty local lists, an accessible consent dialog offers:

- import to the account;
- keep only on this device;
- decide later.

Import matches list names case-insensitively, preserves item timestamps, skips stable `assetKey` duplicates, reports partial errors, is safe to repeat, and never deletes the local backup. The decision is stored per user on the device; “later” is only suppressed for the current browser session.

## Data model and RLS

`supabase/migrations/20260805190000_intelligent_alerts.sql` adds or creates:

- explicit identity fields on `watchlist_items`;
- `alert_preferences`;
- `alert_rule_versions`;
- `alert_events`;
- `alert_deliveries`;
- `alert_job_runs` for execution locks and safe operational counts.

`supabase/migrations/20260807190105_configurable_alert_subscriptions.sql` adds the user-owned `alert_subscriptions` table and its RLS policies. It must be applied after the base alert migration.

`20260811142159_arbitrage_alert_subscriptions.sql` adds user-owned Radar subscriptions. `20260811154500_verified_arbitrage_monitoring.sql` adds the legacy `any_verified` database scope, now presented as an amount-independent quote-difference monitor: each user configures a minimum ARS-per-USD spread for all comparable quotes of one asset without selecting a fixed origin and destination. The retained `amount_usd` column receives a neutral value for backward compatibility and is not used by rule version 4.

RLS is enabled on every exposed table. Authenticated clients may manage their own preferences, read their own delivered events/deliveries, and update only the `read_at` column on their own events. They receive no insert privilege on events/deliveries and no access to internal rule versions or job runs. Rules and events are written through a server-only Supabase client using `SUPABASE_SECRET_KEY` (preferred) or the legacy `SUPABASE_SERVICE_ROLE_KEY` fallback; neither value may be exposed to client code or prefixed with `NEXT_PUBLIC_`.

No `profiles` table is required. Authorization uses the validated Auth identity and row ownership, never user-editable metadata.

## Automatic and configurable alerts

Instrument types are normalized before evaluation. Active technical rules support stocks, ETFs, ADRs, CEDEARs, CEDEAR ETFs, and crypto only. Bonds, bills, corporate bonds, and unknown types are skipped because their required real inputs are unavailable.

Active version 1 rules:

- volatility-adjusted unusual price move;
- unusual volume against the prior 20 usable bars;
- trend break/recovery through EMA50 or the prior 20-bar range with ATR buffer;
- elevated 10-bar realized volatility against the instrument's own preceding baseline;
- optional opportunity, only when an upward trend event and a second independent price/volume rule trigger together.

In addition, an authenticated user can create deterministic personal alerts from any supported asset card in a watchlist or from the alert center. The available conditions are:

- crossing above or below a configured price;
- rising or falling by a configured current-session percentage versus the prior close;
- approaching the daily EMA 200 within a configured percentage;
- approaching the prior 20, 60, 120, or 200-session daily low or high within a configured percentage.

"Period low/high" is intentionally explicit: it is not an undocumented all-time historical floor or ceiling. Creating an alert from search first adds the normalized Instrument Master identity to the selected account watchlist, then stores the alert subscription. Personal alerts use the same provider, freshness, evidence, deduplication, cadence, and no-order guarantees as automatic rules.

From the Radar summary, a user can request an amount-independent quote-difference alert for USD bank, USDT, or USDC. On every monitor run the engine evaluates same-asset comparisons, selects the largest current gross spread, and alerts when it reaches the configured ARS-per-USD threshold. Both quotes must have been retrieved by CMA within five minutes and must not be stale or unavailable. The notification explicitly states that the spread is gross and that amount, costs, limits, transfer availability, and net result belong in the calculator and final provider verification. The calculator can also create the same threshold alert for one fixed provider comparison.

See `docs/alert-rules-catalog.md` for exact requirements and limitations.

Severity uses informational, low, medium, high, and critical. It combines normalized magnitude, independent confirmations, usable volume, freshness, and data quality. Critical requires a confidence score of at least 0.94 and should be rare. Confidence is an evidence-quality priority score, not a probability of profit.

## Freshness and sources

Automatic-rule evaluation requires parseable `observedAt` and `fetchedAt`, `fetchedAt >= observedAt`, a successful non-mock Trade Radar provider response, and at least 220 normalized daily candles. Daily crypto data is considered stale after 36 hours; other daily markets after 96 hours to account for weekends. Personal rules additionally require a current quote with a provider observation timestamp: end-of-day-only quotes are rejected, real-time observations expire after 15 minutes, and delayed or unspecified observations after 45 minutes. Stale, incomplete, or failed-provider inputs produce no alert.

For price-crossing alerts, `alert_subscription_states` persists the last accepted observed quote. This prevents the first observation from being misreported as a crossing and allows subsequent executions to detect the direction deterministically. EMA 200 and period high/low alerts compare the current quote with daily OHLCV references; the interface and evidence state that distinction explicitly.

The operational source is the provider selected by the existing Trade Radar provider router (for example Yahoo-compatible public data, Binance, or a configured provider). The exact provider and timestamps are persisted with each event and evidence item. Local BYMA quote-only snapshots are not converted into OHLCV history.

Disabled categories:

- bonds and bills: current prices/cash flows/yields are not sufficiently real and complete;
- corporate bonds: issuer/cash-flow/credit-event source unavailable;
- material news: no validated licensed material-news contract;

## Deduplication, cooldown, and lifecycle

One partial unique index allows only one active event per user, instrument, rule, and direction. Each execution also stores a time-window deduplication key. When a condition remains active, the scheduler updates evidence and evaluation time instead of inserting another event; higher severity escalates the existing event. Missing conditions resolve active events. A resolved condition can reactivate only after the rule-specific cooldown. Delivery rows are unique per event/channel.

Deleting a watchlist sets historical event `watchlist_id` to null instead of deleting history. Because the scheduler reads only existing monitored lists, future evaluation for that deleted list stops automatically.

## Scheduler

The repository deliberately ships without an active scheduler until the deployment plan and secrets are known. Choose exactly one strategy; enabling both would duplicate requests even though the database execution lock prevents duplicate processing.

- **Vercel Pro or another plan supporting five-minute Cron:** copy `docs/vercel-cron.pro.example.json` to the repository root as `vercel.json`. Configure `CRON_SECRET` in Vercel and keep Supabase Cron disabled.
- **Vercel Hobby or no suitable Vercel Cron:** keep `vercel.json` absent. Store `cma_alerts_endpoint_url` and `cma_alerts_cron_secret` in Supabase Vault, then run `supabase/snippets/enable_intelligent_alerts_cron.sql`. The secret must equal the application's `CRON_SECRET`. Use the paired disable snippet for rollback.

Both strategies invoke `/api/alerts/evaluate` with `Authorization: Bearer <CRON_SECRET>`; the handler validates it with a constant-time comparison. The same endpoint accepts an authorized POST for controlled manual validation. Never write the endpoint or secret value into a versioned SQL file.

The five-minute invocation uses a hybrid cadence:

- personal crypto alerts: up to every five minutes, 24/7;
- personal Argentina/CEDEAR alerts: up to every five minutes on weekdays between 12:30 and 21:00 UTC;
- personal US/other alerts: up to every five minutes on weekdays between 13:00 and 22:00 UTC;
- automatic technical rules: once per applicable daily evaluation window, preserving their daily OHLCV semantics.

The job uses a database unique lock per five-minute execution window, bounded batches, per-instrument error isolation, safe aggregate counters, provider failure isolation, deduplicated user/instrument work, and a 60-second function limit. Fatal setup/query failures mark the job run as failed; isolated instrument failures mark it partial. Later runs safely resume from persisted state.

## Preferences, quiet hours, and channels

Users choose monitored lists, minimum severity for automatic alerts, immediate/hourly/daily delivery, quiet hours/timezone, opportunities, global enablement, and in-app enablement. A personal alert is an explicit request, so it is not hidden by the global minimum-severity selector; global enablement, channel, frequency, quiet hours, and selected-list settings still apply. Users can pause, resume, or delete each personal alert.

In-app is implemented through persisted delivery rows. Immediate items outside quiet hours are marked sent; digest or quiet-hour items remain pending and a later scheduler run releases them. The center and unread badge display only sent in-app deliveries, so delivery preferences apply even when the page is closed.

Email delivery uses Resend and the verified email address of the authenticated Supabase account. The production product exposes two notification channels: persisted notifications in the web Alert Center and opt-in email. Both respect delivery frequency and quiet hours, write delivery metadata to `alert_deliveries`, and never expose provider credentials to the browser.

Resend requests use the alert event ID as an idempotency key. The stored email `sent` state means Resend accepted the request, not that the recipient necessarily opened it.

## User interface and accessibility

- `/alerts`: create and manage personal alerts, understand automatic monitoring, view delivered history, unread count, severity/category/watchlist/instrument/date filters, and mark one/all read.
- `/alerts/[id]`: rule/version, severity, confidence, provider, freshness, evidence, limitations, market/currency, and Trade Radar link.
- `/account/alerts`: delivery preferences.
- desktop/mobile sidebar: visible Alerts entry and accessible unread count.

Controls have labels and touch-sized targets; state is not communicated by color alone; the import dialog traps/restores focus and supports Escape; status messages use live regions. The surfaces reuse existing CSS variables and therefore support dark/light modes.

## Configuration and migration

Required server configuration:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY             server only, preferred
SUPABASE_SERVICE_ROLE_KEY       server only, legacy fallback
CRON_SECRET                    server only, random 16+ characters
RESEND_API_KEY                 server only, provisioned by Resend
RESEND_FROM_EMAIL              verified sender, for example CMA Alerts <alerts@example.com>
NEXT_PUBLIC_SITE_URL           canonical production origin for alert links
```

1. Review and apply migrations in timestamp order to the intended Supabase project. With a linked CLI use `supabase db push`; otherwise paste the reviewed migration into the project's SQL Editor.
2. Confirm the Data API exposes `public`, the migration grants are present, and the Supabase security/performance advisors show no new alert-table issue.
3. Add the server-only variables to the application environment. Do not put them in browser code, SQL, screenshots, or logs.
4. Verify the Resend sender domain and confirm that users receive a controlled email alert before enabling the channel broadly.
5. Determine the Vercel plan and activate exactly one scheduler strategy described above. The Supabase strategy requires the `pg_cron`, `pg_net`, and Vault capabilities used by the supplied snippet.
6. Run one authorized controlled evaluation, then verify `alert_job_runs`, rule versions, events, deliveries, and the account UI. Confirm provider acceptance separately from final delivery/read status.
7. Test two real users: each can see only their own watchlists, preferences, events, and deliveries; neither can insert events/deliveries nor read rule/job internals.
8. Test the explicit browser-local watchlist import, repeat it to verify idempotency, and confirm the local backup remains intact.

Safe rollback is to disable the Cron job and remove the navigation exposure while retaining tables/history for investigation. Do not drop alert tables or watchlist columns without a reviewed backup and a separate destructive migration.

## Tests and limitations

Unit tests cover classification, compatible/incompatible rules, all active categories, opportunity confirmation, freshness, incomplete data, provider health, preferences, quiet hours, deduplication, cooldown, cadence, idempotent import, and static RLS/grant invariants. Playwright covers discoverability, authentication boundaries, configuration messaging, and mobile overflow without requiring real market movements.

The intraday state migration and five-minute scheduler templates are versioned but are not applied or activated merely because this code compiles. Production still requires applying the reviewed migrations, confirming server credentials, selecting exactly one scheduler strategy, and completing the live two-user RLS and controlled-delivery checks.

The alert branch was integrated with the then-current `main` changes for Radar de Arbitraje and Argentina reference sources. Shared navigation and translations expose both modules; alert rules remain independent from arbitrage providers and calculations.

Future work: licensed news/email providers, verified fixed-income inputs, calibrated thresholds from historical replay, batched/queued execution for larger user counts, alert utility metrics, retry policies, and production browser/RLS evidence.
