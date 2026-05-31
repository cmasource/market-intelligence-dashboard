# UI Decisions

## Market Signal vs Technical Score

The market signal is an integrated intelligence signal. It combines available technical, fundamental, fixed-income, risk and data-quality context. It is shown as an executive radial module.

The technical score is a pure market-engine reading. It focuses on trend, momentum, moving averages, RSI and MACD. It is shown as a technical factor panel with horizontal bars so it does not look like the market signal.

## Data Coverage

Coverage is important for public-demo trust, but it is not the primary user task on the asset page. Sprint 22 moves it into a disclosure that remains accessible through "View data coverage" / "Ver cobertura de datos".

## Asset Logos

Asset identity uses `lib/assets/logo-map.ts` and `components/assets/AssetLogo.tsx`.

The strategy is safe by default:

- known symbols get curated metadata, initials and accent colors
- missing symbols fall back to a deterministic monogram
- no secrets, database or external authentication are required
- no page should break if a logo is missing

## Argentina and Local Data

Argentina, CEDEAR and fixed-income data continue to show source context. Manual, mock, provider and future coverage labels remain visible, but secondary to the market reading.

## Report vs Asset Page

The report page remains an editorial, shareable brief. The asset page is now a working analysis terminal with chart, signal, technical, fundamentals, local context, news and risks arranged for faster scanning.

