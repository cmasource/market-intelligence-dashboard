# Theme

## Compact design tokens

- Typeface: Inter/system sans; financial metrics use tabular numerals and optional SFMono/Consolas.
- Dark base/panel/elevated: `#0b0f14`, `#101720`, `#151e28`.
- Light base/panel: `#f5f6f8`, `#ffffff`.
- Primary/secondary/muted dark text: `#f3f5f7`, `#aeb9c5`, `#718195`.
- Primary/secondary/muted light text: `#14181d`, `#454c56`, `#6b7280`.
- Brand accent: teal `#27b7ae` dark, `#0f766e` light.
- Semantic colors: positive `#2f9e6e`, warning `#c98a2c`, negative `#d3564a`.
- Borders: low-contrast neutral; stronger border is teal at 40-45% opacity.
- Existing panel radius: 8px. New Radar may use a slightly stronger hierarchy but must remain compatible with the shared shell.
- Light and dark modes are first-class and must have equivalent contrast and hierarchy.

## Raw CSS source

The full canonical source is `app/globals.css` (512 lines) and begins with `@import "tailwindcss"`. Use its `--cma-*` variables, `.cma-shell`, `.cma-panel*`, `.cma-kicker`, `.cma-metric`, and responsive/reduced-motion rules verbatim as runtime context. Do not introduce a second theme system.
