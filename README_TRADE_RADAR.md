# CMA Trade Radar

Modulo rapido en `/trade-radar` para analizar un ticker con datos OHLCV reales de proveedor y calculos tecnicos deterministas en backend.

## Endpoint

- Ruta: `/api/trade-radar/analyze`
- Busqueda: `/api/trade-radar/search?q=ms&market=us&limit=8`
- Estado de proveedores: `/api/trade-radar/provider-status`
- Metodos: `GET` y `POST`
- Parametros: `symbol`, `market`, `interval`, `provider`
- Valores:
  - `market`: `us`, `argentina`, `cedear`, `crypto`, `bond`, `auto`
  - `interval`: `1h`, `4h`, `1d`
  - `provider`: `auto`, `twelveData`, `alphaVantage`, `fmp`, `byma`, `binance`

Ejemplo:

```bash
curl "http://localhost:3000/api/trade-radar/analyze?symbol=BTC-USD&market=crypto&interval=4h&provider=auto"
```

## Trazabilidad

Cada respuesta incluye proveedor, timestamp de ultima vela, delay (`realtime`, `delayed`, `eod`, `unknown`), moneda, mercado, cantidad de velas usadas, fuente, fallos de proveedores previos y lista de indicadores omitidos.

El endpoint no usa IA para calcular indicadores. EMA 20, EMA 50, MA 200, RSI 14, ATR 14, volumen promedio, soportes, resistencias, senales y alertas se calculan en `lib/technical`.

## Proveedores

- `crypto`: Binance primero. Usa `BINANCE_BASE_URL` o `https://api.binance.com`.
- `us`: Twelve Data primero; fallback Alpha Vantage; fallback FMP.
- `provider=auto` no lee `MARKET_DATA_PROVIDER`; esa variable puede seguir en `fmp` para otros modulos.
- Si FMP responde 403, se omite como respaldo OHLCV y se devuelve diagnostico claro.
- `argentina` y `bond`: BYMA solo como cotizacion local. No se calculan indicadores tecnicos si no hay historico OHLCV real suficiente.
- `cedear`: intenta resolver subyacente USA y analizar esa capa. Si BYMA esta configurado, agrega cotizacion local del CEDEAR.

Variables esperadas:

```txt
TWELVE_DATA_API_KEY=
ALPHA_VANTAGE_API_KEY=
FMP_API_KEY=
BYMA_API_KEY=
BYMA_BASE_URL=https://apigw.byma.com.ar
BYMA_CLIENT_ID=
BYMA_CLIENT_SECRET=
BYMA_SCOPE=snapshot.read eod.read delay20.read
BYMA_DEFAULT_FEED=delay20
BINANCE_BASE_URL=https://api.binance.com
```

## Validaciones

- No emite senales operativas si hay menos de 220 velas.
- No calcula MA 200 si no hay al menos 200 cierres.
- No convierte un snapshot BYMA en OHLCV historico.
- BYMA local muestra cotizacion, bid/ask, volumen y monto cuando el feed lo entrega.
- No usa mock data para el radar.
- No usa scraping de TradingView, Investing ni Yahoo.
- El grafico embebido de TradingView es visual y no se usa como fuente de indicadores.

## Tests

```bash
npm run test:technical
```
