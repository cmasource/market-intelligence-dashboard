# CMA Markets design system for Radar de Arbitraje

## Product character

An evidence-first financial workstation: restrained, precise, compact enough for comparison, but easier to scan than a raw terminal. Teal is the brand/action color; green, amber, and red are reserved for financial meaning. Avoid decorative gradients and glass effects.

## Page hierarchy

- Keep the shared CMA sidebar, ticker header, footer, 1400px content width, and dark/light themes.
- Use a concise title/refresh row followed by an explicit educational explanation of client perspective.
- Make the asset selector the primary control. A selected asset defines every ranking, route, and calculator result below it.
- Show each provider once with logo/name, both `Comprás a` and `Vendés a`, source, observation time, and verification status.
- Use compact route cards or a filtered same-asset table. Do not render the full incompatible cross-product as the main experience.

## Financial semantics

- `Comprás a` = ARS the user pays per unit received = upstream ask / totalAsk.
- `Vendés a` = ARS the user receives per unit sold = upstream bid / totalBid.
- USD bancario, USDT, and USDC are separate assets. Never compute or imply direct arbitrage between them without an explicit conversion route and known costs.
- Unknown costs/capabilities may produce only `Posible diferencia bruta`, never a verified net opportunity.
- Stale or timestamp-unverifiable data stays visible as reference and outside active opportunities.

## Visual details

- Provider marks: 40–48px logo tile, white/neutral backing when required, initials fallback.
- Quote cards: 12–16px internal spacing, strong provider header, paired price cells, tabular numerals.
- Primary numerical value: 24–32px; supporting metadata: 12–13px.
- Status badges: compact pills with icon + explicit label; never color alone.
- Touch targets: minimum 44px. Keyboard focus must be visible.
- Desktop: 2–3 column provider cards; mobile: single-column with no horizontal overflow.
- Tables, when necessary, use sticky identity columns and only same-asset comparable rows.
