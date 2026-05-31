# Sprint 22 Asset Page Redesign

Sprint 22 reorganizes `/asset/[symbol]` around fewer, stronger modules. The goal is to make CMA Market Intelligence feel like a premium market terminal while reducing repeated explanations.

## Information Architecture

The asset page now follows this hierarchy:

1. Asset hero header with logo/fallback mark, symbol, name, market chips, source chip, price and CTAs.
2. Compact executive summary strip with integrated signal, confidence, score and one concise reading.
3. Main analytical zone:
   - Left column: price action chart, technical engine, news pulse.
   - Right column: integrated market signal, fundamental summary, CEDEAR/local or fixed-income context, risks.
4. Secondary detail zone with progressive disclosure for technical notes, fundamental notes, data coverage and methodology transparency.

## Repetition Reduction

The full asset page no longer embeds the full shareable intelligence report. The report remains available at `/report/[symbol]`, while the asset page uses a compact executive summary and focused analytical modules.

## Coverage Disclosure

Data coverage moved from a visually dominant block to a secondary disclosure. This keeps transparency available without making provider mechanics compete with the market reading.

## Non-Advisory Language

All readings remain informational. The UI avoids direct recommendation wording and keeps signal language in the approved CMA range: Muy defensivo, Defensivo, Neutral, Constructivo and Muy constructivo.

