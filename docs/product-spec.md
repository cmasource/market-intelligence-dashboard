# CMA Market Intelligence Product Spec

## Product Vision

CMA Market Intelligence is a professional financial intelligence dashboard created under CMA Consulting and technologically developed by cma_source. The platform helps consultants, analysts and decision-makers interpret financial markets faster through a unified view of technical analysis, fundamental analysis, fixed income analytics, crypto monitoring, Argentina market context and AI-assisted market interpretation.

## Branding

- Product: CMA Market Intelligence
- Company: CMA Consulting
- Technology division: cma_source
- cma_source must always be written in lowercase with the underscore.

## Target Users

- Business consultants who need fast market context for client conversations.
- Financial analysts who monitor multi-asset opportunities.
- Argentina-focused market participants tracking equities, bonds, FX references and liquidity.
- Future AI agent users who need structured financial context and report-ready summaries.

## Main Modules

- Market overview across global, local and crypto references.
- Asset search and detail pages for stocks, ETFs, CEDEARs, Argentine equities, bonds, letras, obligaciones negociables and cryptocurrencies.
- Interactive asset chart module with OHLCV candles, timeframe switching, source labels, mock fallback and volume histogram support.
- First market-data service layer for USA stocks, ETFs and crypto charts with mock fallback behavior.
- Technical analysis summary with trend, momentum, support, resistance and volatility signals.
- Technical analysis calculations from OHLCV candles through the market data layer.
- Fundamental analysis summary for equity-like instruments.
- Fundamentals provider layer for selected USA stocks and ETFs with fallback-safe behavior.
- Fixed income analytics for sovereign bonds and CER-linked instruments, including mock yield, duration, convexity, cash flows and risk profiles.
- Instrument universe relationships for Argentine bond species and future CEDEAR/ADR mappings.
- Instrument screener with search, category, market, country, currency and data-status filters.
- Market universe page with group cards for Argentine equities, CEDEARs, sovereign bonds and species, ETFs, USA stocks and crypto.
- Data coverage badges showing real/provider, mock/fallback, future, not-applicable and unavailable layers.
- Data audit and methodology pages explaining coverage status, calculation inputs and analytical limitations.
- Centralized currency formatting for USD and ARS, with MEP, cable/CCL and CER shown as bond species or indexation context rather than price currencies.
- Contextual glossary tooltips for technical, fundamental and fixed income metrics.
- Local Argentine equity prices must display as ARS, not ARS/USD or USD/ARS composites.
- Bond species display conventions must distinguish quote currency from settlement/species context.
- Crypto monitor with future arbitrage intelligence.
- Argentina market module for local equities, bonds, CER-linked assets and FX references.
- AI-style market interpretation and future agent-ready structure.
- News placeholder for later data-provider integrations.
- Reports placeholder for future market briefings and AI-generated PDFs.

## MVP Scope

- Next.js App Router frontend.
- TypeScript and Tailwind CSS.
- Responsive dashboard and asset detail page.
- Internal bilingual support for English and Spanish.
- Interactive charting using TradingView Lightweight Charts.
- Real-data attempts for `AAPL`, `SPY`, `QQQ`, `BTC-USD` and `ETH-USD` through internal provider adapters.
- Expanded provider/fallback data attempts for `MSFT`, `NVDA`, `TSLA`, `AMZN`, `META`, `GOOGL`, `KO`, `BNB-USD`, `SOL-USD`, `XRP-USD`, `ADA-USD`, `DOGE-USD`, `AVAX-USD`, `LINK-USD` and `DOT-USD`.
- Provider fundamentals attempts for `AAPL`, `SPY` and `QQQ`.
- Mock fixed income analytics for `AL30`, `GD30` and `TX26`.
- Related species visibility for `AL30`, `AL30D`, `AL30C`, `GD30`, `GD30D` and `GD30C`.
- Screener visibility for mock-supported, real-supported and future-supported instruments.
- Universal home search across the structured instrument universe.
- CEDEAR model foundation for future local prices, ratios, dollar species and implied CCL.
- Graceful preliminary profiles for future-coverage instruments that are in the universe but do not yet have full analysis data.
- Local recent-search history for the home search experience.
- Appearance preference toggle for dark and light modes, with dark as the default.
- Integrated market signal gauge that combines technical and fundamental inputs when available.
- Technical signal gauge using non-advisory terminology instead of buy/sell recommendations.
- Public demo footer with informational disclaimer, data coverage note and core navigation links.
- Vercel deployment readiness documentation and pre-deploy validation checklist.
- Manual technical and fundamental validation guides for comparison against external market platforms.
- Public financial glossary page for concise metric definitions.
- Conservative noindex/nofollow metadata for the current public demo.
- `.env.example` placeholder for future provider, AI, news and database integrations.
- Mock fallback data preserved for every instrument.
- No authenticated external APIs.
- No authentication.
- No database.
- Clear financial disclaimer across dashboard and detail pages.

## Bilingual Support

- Current support: English and Spanish.
- Browser language detection uses `navigator.language`.
- If the browser language starts with `es`, Spanish is selected.
- Otherwise English is selected.
- Users can manually switch language with the EN / ES switcher.
- The selected language persists in `localStorage`.
- No external i18n library is used.

## Future Regional Personalization

- Argentina: BYMA, CEDEARs, sovereign bonds, CER-linked instruments, MEP, CCL and local rates.
- United States: equities, ETFs, macro references, earnings and sector context.
- Latin America: regional equities, sovereign risk, FX and cross-border market context.
- Global crypto markets: BTC, ETH, stablecoins, crypto dollars, liquidity and arbitrage references.

## Future Modules

- Expanded real market data integration.
- Advanced technical overlays for SMA, EMA, RSI and MACD.
- Multi-timeframe technical confirmation and backtesting.
- Fundamentals provider expansion and historical fundamentals.
- Calculation engine for fundamentals, bonds, returns and risk.
- Argentina market data adapters.
- Crypto dollar, MEP and CCL arbitrage intelligence.
- AI agents for screening, summaries, alerts and report generation.
- User workspaces, watchlists and saved reports.

## Compliance Note

English: This platform provides informational analysis only and does not constitute personalized financial advice.

Spanish: Esta plataforma brinda análisis informativo y no constituye asesoramiento financiero personalizado.
