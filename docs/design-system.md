# CMA Institutional Fintech Terminal

CMA Market Intelligence now uses an original visual direction called **CMA Institutional Fintech Terminal**.

## Visual pillars

1. Institutional dark fintech base.
2. Trading-terminal data density.
3. BI clarity inspired by Basedash.
4. Crypto/trading energy inspired by AxCorp and Cryptolly mood references.
5. Original CMA identity, without copying third-party templates, assets, gradients, layouts, logos, videos or CSS.

## Tokens

The global tokens live in `app/globals.css`:

- `--cma-bg-base`
- `--cma-bg-panel`
- `--cma-bg-elevated`
- `--cma-bg-glass`
- `--cma-border-soft`
- `--cma-border-strong`
- `--cma-text-primary`
- `--cma-text-secondary`
- `--cma-text-muted`
- `--cma-accent-cyan`
- `--cma-accent-blue`
- `--cma-accent-violet`
- `--cma-positive`
- `--cma-warning`
- `--cma-negative`

Dark mode remains the default. Light mode uses an institutional light fintech palette with stronger text contrast and visible card surfaces.

## Utility families

- `.cma-shell`: app-level base.
- `.cma-market-background`: radial glow and market terminal background.
- `.cma-terminal-grid`: subtle financial grid overlay.
- `.cma-panel`: standard dashboard panel.
- `.cma-panel-elevated`: primary hero or executive panel.
- `.cma-panel-glass`: sticky/glass surfaces and terminal panels.
- `.cma-card-price`: quote and market data cards.
- `.cma-card-analysis`: technical, fundamental and intelligence cards.
- `.cma-card-risk`: risk and limitation cards.
- `.cma-card-news`: news/editorial cards.
- `.cma-card-argentina`: Argentina, CEDEAR and local-market cards.
- `.cma-kicker`: uppercase institutional micro-label.
- `.cma-metric`: tabular numeric emphasis.

## Page philosophy

Dashboard and screener pages use wide layouts up to roughly 1520px so data modules can breathe. Asset pages use a full working-analysis rhythm. Report pages stay narrower and more editorial for sharing.

## Interaction

Motion is intentionally subtle: hover elevation, active navigation states, and quiet glow accents. The CSS respects `prefers-reduced-motion`.
