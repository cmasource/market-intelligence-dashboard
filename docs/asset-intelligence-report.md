# Asset Intelligence Report

CMA Market Intelligence now includes an Asset Intelligence Report layer for public demos.

## What It Combines

The report synthesizes current price, market signal, technical analysis, fundamentals when applicable, recent news headlines, CEDEAR context, fixed income context, key risks, and data coverage limitations.

## Data Transparency

Each report keeps source labels visible. Provider data, Yahoo-compatible fallback, RSS/news fallback, structured mock data, and future coverage are treated as different states.

Argentina local fixed income and CEDEAR local prices remain structured mock data until BYMA/IOL/CNV, broker, or licensed provider integrations are enabled.

## Non-Advisory Language

The report does not produce direct investment recommendations. It uses non-advisory labels such as Very defensive, Defensive, Neutral, Constructive, and Very constructive.

The report should be read as informational context, not as personalized financial advice.

## Sprint 19.1 Interpretation Localization

Spanish report sections now use human-readable interpretation text for technical and fundamental readings instead of exposing internal labels such as trend or momentum codes. Financial acronyms such as RSI, MACD, SMA, P/E, EBITDA, ROE and ROA remain in their standard market form, while explanations, warnings and context are localized.

Technical summaries explain why the score is high or low using moving averages, RSI, MACD, support/resistance and data-source context. Fundamental summaries explain valuation, profitability, solvency/liquidity and missing provider fields. These summaries are educational and must not be read as trading instructions.

## Shareable Route

Use `/report/[symbol]` for public demos, for example `/report/AAPL`, `/report/MSFT`, `/report/BTC-USD`, or `/report/AL30`.

Sprint 19.2 separates the shareable report from the full asset profile more clearly. The report route now presents a cleaner executive summary with a prominent executive reading, compact technical and fundamental synthesis blocks, a news pulse, risks, and data limitations. It is intended for external demo sharing and quick review.

The full asset profile remains available at `/asset/[symbol]` and keeps the working analysis modules, chart, provider panels, CEDEAR analytics, fundamentals, technical analysis cards, news panel and related instrument workflows.

Spanish report mode now uses single-language copy for the report intro, CTA buttons, section labels and scope disclaimer. Acronyms such as RSI, MACD, SMA, P/E, EBITDA, ROE and ROA remain in their standard financial form, while surrounding explanations stay human-readable and localized.

## Sprint 19.3 Report Mode Polish

`/report/[symbol]` now uses a dedicated report mode. It starts with a compact summary strip for price, signal, confidence and source, then moves through executive reading, concise key points, technical/fundamental synthesis, news, CEDEAR context, risks and data limitations.

`/asset/[symbol]` remains the full working analysis page with deeper modules and supporting panels.

Key points are intentionally short and non-repetitive. The executive reading gives the broad conclusion, the market signal shows score and confidence, technical/fundamental sections explain their own evidence, and risks stay focused on uncertainty.

CEDEAR context includes a "How to read it" note for Argentine users: use the underlying asset for trend and fundamentals, use the CEDEAR for local price/liquidity/implied CCL context, and do not treat simulated CCL as live operating data until BYMA/IOL or licensed-provider integration is enabled.

News headlines may appear in the original language of the source. The UI labels that behavior so the report can remain localized without rewriting sourced headlines.

## Sprint 20.1 Public Demo Polish

Fundamental summaries now treat provider coverage as partial when several fields are unavailable. A provider-supported equity can show available metrics while clearly labeling missing values as unavailable from the current provider instead of looking broken.

News titles and snippets are sanitized before rendering: common HTML entities are decoded, tags are stripped, and whitespace is normalized. The report layout also uses slightly more spacing between the summary strip, executive reading, key points, analytics cards, news, risks and data limitations so public-demo pages are easier to scan.
