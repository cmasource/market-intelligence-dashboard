# Argentina Manual Data Import

Manual Argentina data lives in `data/argentina-quotes.manual.json`.

## Workflow

1. Get local prices from a validated source manually.
2. Update `data/argentina-quotes.manual.json`.
3. Keep quote currency as `ARS` or `USD` only.
4. Keep MEP, cable/CCL and CER as context fields in the registry, not quote currencies.
5. Run `npm run validate:argentina`.
6. Run the normal validation stack.
7. Commit and deploy.

## Sample CSV

`data/argentina-quotes.sample.csv` documents the expected manual import columns:

- `symbol`
- `price`
- `currency`
- `change`
- `changePercent`
- `bid`
- `ask`
- `volume`
- `tradedAmount`
- `open`
- `previousClose`
- `high`
- `low`
- `lastUpdated`
- `sourceLabel`

## Limits

Manual data is not real-time. It is an interim path for demo-safe local values while BYMA, broker or licensed-provider integrations are pending. Do not store secrets in manual data files.
