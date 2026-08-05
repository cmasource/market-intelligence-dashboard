# Radar de Arbitraje

## 1. Objetivo

Radar de Arbitraje compara cotizaciones públicas normalizadas desde la perspectiva del usuario para detectar diferencias informativas entre una compra y una venta de dólares. No promete resultados ni sustituye la verificación final en cada proveedor.

## 2. Alcance

La primera versión ofrece rankings de compra y venta, matriz de rutas, calculadora por monto, filtros, frescura, trazabilidad de fuente, compatibilidad operativa y resultados brutos o netos según la confianza de los costos.

## 3. Funciones excluidas

No ejecuta operaciones, transferencias ni órdenes; no conecta cuentas; no automatiza logins; no almacena credenciales, cookies externas, preferencias, historial ni alertas. Tampoco reutiliza `/api/research/wallet-rates`, que corresponde a rendimientos de cuentas.

## 4. Arquitectura

La ruta pública `/radar-arbitraje` usa un componente cliente para interacción y consume `/api/arbitrage/quotes`. El backend coordina adapters server-side. El dominio en `lib/arbitrage` mantiene separados registro de proveedores, adapters, normalización, frescura, compatibilidad y cálculo puro. Las cotizaciones sólo se conservan en una caché efímera del proceso.

## 5. Normalización de compra y venta

`userBuysUsdAt` representa los ARS que paga el usuario por USD 1 y `userSellsUsdAt` los ARS que recibe al vender USD 1. Los adapters invierten los campos cuando la fuente publica desde la perspectiva de la entidad y conservan `originalBuyLabel` y `originalSellLabel` para trazabilidad.

## 6. Modelo de proveedores

`FxProvider` registra tipo, sitio, disponibilidad 24/7, capacidades de depósito/retiro por activo, requisito de misma titularidad, tipo de fuente y estado. Un proveedor investigado pero sin fuente pública estable permanece `temporarily_unavailable` o `unsupported`; su presencia en el registro no implica integración.

## 7. Modelo de cotizaciones

`FxQuote` identifica proveedor, instrumento (`bank_usd`, `usd_24_7`, `mep`, `usdt`, `usdc`, entre otros), activo transferido (`USD_BANK`, `USDT` o `USDC`), precios normalizados, etiquetas originales, observación, obtención, fuente, estado, costos, límites y advertencias.

## 8. Compatibilidad

Una ruta se bloquea cuando usa el mismo proveedor, faltan precios, los activos no coinciden, una fuente está vencida, un proveedor no está activo, no se puede retirar o depositar el activo, la capacidad no fue verificada o el monto incumple límites informados. La misma titularidad se expone como requisito/advertencia. USD bancario, USDT y USDC no se mezclan implícitamente.

## 9. Motor de cálculo

El motor es determinístico y no usa IA:

```text
spread bruto por USD = precio de venta del usuario - precio de compra del usuario
resultado bruto = spread bruto por USD × monto USD
capital requerido = precio de compra del usuario × monto USD
resultado neto = resultado bruto - costos de origen - costos de destino - transferencia
retorno neto = resultado neto / capital requerido × 100
```

Una combinación sólo se considera oportunidad si la ruta es compatible, está vigente y el resultado comparable es positivo.

## 10. Costos

El modelo contempla cargos fijos en ARS, porcentuales, fijos en USD y costos de transferencia. Cada costo se clasifica como confirmado, estimado o desconocido. Si falta información, la UI muestra “Costos no verificados” y sólo comunica una diferencia o ganancia bruta estimada; no afirma una ganancia neta.

## 11. Límites

Se admiten mínimo, máximo por operación, máximo diario y máximo mensual. Los adapters no inventan límites. Un límite ausente se muestra como no informado y un monto fuera de rango bloquea la ruta.

## 12. Frescura

Cada quote contiene `observedAt`, `fetchedAt`, estado y fuente. Los umbrales son configurables por proveedor: Plus usa 120 segundos como fresco y 600 como vencido; Banco Nación, por la naturaleza de su pizarra, 4 y 12 horas; los agregados usan 120 y 300 segundos. Una cotización vencida puede verse, pero no genera oportunidades activas. Cuando el agregador no entrega hora original, se marca como dato demorado/no verificable.

## 13. Caché

La caché server-side es efímera y diferenciada: Plus 60 segundos, Banco Nación 300 segundos y DolarApi 60 segundos. Se deduplican solicitudes concurrentes. Ante un fallo se reutiliza el último valor válido únicamente como `stale_fallback`, marcado desactualizado. No hay polling por segundo; la actualización manual usa `refresh=1`.

## 14. Endpoint

`GET /api/arbitrage/quotes` ejecuta los adapters con timeout individual y `Promise.allSettled`, por lo que una fuente caída no derriba las restantes. Devuelve quotes normalizados, estado de cada proveedor, TTL y disclaimer. Los fallos externos se reducen a códigos seguros sin filtrar detalles internos.

## 15. Interfaz

La pantalla conserva AppShell, navegación e internacionalización existentes. Incluye mejor combinación, rankings, matriz accesible, calculadora, filtros y estado de fuentes. En mobile la matriz pasa a tarjetas y las tablas de detalle mantienen scroll horizontal contenido. La simulación inicial es USD 1.000 y no se persiste.

## 16. Seguridad

Todas las consultas externas se hacen en servidor a fuentes públicas verificadas. No se incorporaron variables de entorno ni cambios en `.env.local`; no se usan secretos, service role, cookies externas ni endpoints autenticados. El sistema de Supabase Auth no fue modificado y la página es pública.

## 17. Pruebas

`tests/arbitrage` cubre adapters, perspectiva de compra/venta, ranking, spreads, costos fijos y porcentuales, transferencia, retorno, montos inválidos, límites, datos parciales, activos incompatibles, mismo proveedor, frescura y el caso negativo 1519/1501,92. `tests/e2e/arbitrage-radar.spec.ts` usa fixtures aisladas de producción para pantalla, sidebar, estados, filtros, calculadora, temas, responsive, consola y overflow.

## 18. Limitaciones

Las fuentes públicas pueden cambiar estructura o disponibilidad. La cotización publicada puede diferir del precio final. Los costos, límites, horarios, titularidad y acreditación no siempre están publicados. DolarApi es un agregador y sus filas observadas no incluyeron timestamp original; por eso sus rutas no se presentan como operativamente verificadas. No se modelaron conversiones intermedias ni liquidación MEP en esta fase.

## 19. Archivos del módulo

- `app/radar-arbitraje/page.tsx` y `app/api/arbitrage/quotes/route.ts`.
- `components/arbitrage/*`.
- `lib/arbitrage/*` y `lib/arbitrage/adapters/*`.
- `tests/arbitrage/*` y `tests/e2e/arbitrage-radar.spec.ts`.
- `docs/arbitrage-radar.md` y `docs/arbitrage-data-sources.md`.
- Integraciones acotadas en `components/layout/Sidebar.tsx`, `lib/i18n/translations.ts` y `package.json`.

## 20. Próximas fases

Confirmar mediante documentación contractual las capacidades, comisiones y límites de más proveedores; agregar adapters sólo cuando exista una fuente pública legítima y estable; modelar rutas con conversiones intermedias; sumar un smoke test externo separado; y, en otra tarea, diseñar preferencias o alertas `arbitrage_opportunity` sin ejecutar operaciones.

