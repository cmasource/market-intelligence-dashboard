# Routes

- `/` dashboard overview
- `/markets` market overview
- `/usa` United States markets
- `/argentina` Argentina markets
- `/crypto` crypto markets
- `/radar-arbitraje` Radar de Arbitraje (target page)
- `/trade-radar` deterministic technical Trade Radar
- `/watchlist` local watchlists
- `/reports` reports and calendars
- `/research` research
- `/account` account
- `/auth/*` authentication
- `/asset/[symbol]` generic asset details
- `/activo/[categoria]/[ticker]` Argentina asset details
- `/report/[symbol]` report details
- `/contact`, `/data-audit`, `/methodology`, `/glossary`, `/status`, `/screener`, `/agents`

The target route is public and rendered by `app/radar-arbitraje/page.tsx` -> `components/arbitrage/ArbitrageRadarPage.tsx` inside the shared `AppShell`.
