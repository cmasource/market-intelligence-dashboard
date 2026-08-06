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

Una combinación sólo se considera **oportunidad verificada** si ambas cotizaciones son frescas y verificadas, la ruta y el activo transferido están verificados, depósito y retiro están confirmados, los costos permiten calcular un resultado neto, los límites informados admiten el monto y el resultado neto es positivo. Una diferencia bruta positiva con datos incompletos se clasifica como **ruta potencial**, no como ganancia neta ni arbitraje confirmado.

## 10. Costos

El modelo contempla cargos fijos en ARS, porcentuales, fijos en USD y costos de transferencia. Cada costo se clasifica como confirmado, estimado o desconocido. Si falta información, la UI muestra “Costos no verificados” y sólo comunica una diferencia o ganancia bruta estimada; no afirma una ganancia neta.

## 11. Límites

Se admiten mínimo, máximo por operación, máximo diario y máximo mensual. Los adapters no inventan límites. Un límite ausente se muestra como no informado y un monto fuera de rango bloquea la ruta.

## 12. Frescura

Cada quote separa `observedAt` (hora publicada por la fuente, si existe) de `fetchedAt` (hora de consulta de CMA). Los umbrales son configurables por proveedor: Plus usa 120 segundos como fresco y 600 como vencido; Banco Nación, por la naturaleza de su pizarra, 4 y 12 horas. Una cotización vencida puede verse, pero no genera oportunidades activas. Cuando un agregador no entrega hora original, `observedAt` queda ausente: `fetchedAt` nunca se usa para simular frescura.

La validación real del 5 de agosto de 2026 encontró en Plus el campo `date: "2026-08-05 13:54:02"` mientras la consulta se realizó a las `14:39:41` de Argentina. El parser interpreta correctamente la fecha local con `-03:00`; la fuente estaba realmente atrasada unos 46 minutos. Se conserva `stale` y la cotización queda sólo como referencia.

## 13. Caché

La caché server-side es efímera y diferenciada: Plus 60 segundos, Banco Nación 300 segundos y CriptoYa 60 segundos. El adapter de CriptoYa consulta USDT y USDC en paralelo y respeta ampliamente su límite público de 120 solicitudes por minuto. Se deduplican solicitudes concurrentes. Ante un fallo se reutiliza el último valor válido únicamente como `stale_fallback`, marcado desactualizado. No hay polling por segundo; la actualización manual usa `refresh=1`.

## 14. Endpoint

`GET /api/arbitrage/quotes` ejecuta los adapters con timeout individual y `Promise.allSettled`, por lo que una fuente caída no derriba las restantes. Devuelve quotes normalizados, estado de cada proveedor, TTL y disclaimer. Los fallos externos se reducen a códigos seguros sin filtrar detalles internos.

## 15. Interfaz

La pantalla conserva AppShell, navegación e internacionalización existentes. Separa cotizaciones informativas, rutas potenciales y oportunidades verificadas. Los estados principales son “Oportunidad verificada”, “Posible diferencia bruta”, “Sin oportunidades verificadas” y “Datos insuficientes”. En mobile la matriz pasa a tarjetas y las tablas de detalle mantienen scroll horizontal contenido. La simulación inicial es USD 1.000 y no se persiste.

## 16. Seguridad

Todas las consultas externas se hacen en servidor a fuentes públicas verificadas. No se incorporaron variables de entorno ni cambios en `.env.local`; no se usan secretos, service role, cookies externas ni endpoints autenticados. El sistema de Supabase Auth no fue modificado y la página es pública.

## 17. Pruebas

`tests/arbitrage` cubre adapters, payload real sanitizado de Plus, zona horaria Argentina, separación `observedAt`/`fetchedAt`, fuente sin timestamp, stale real, niveles de verificación, costos y límites desconocidos, perspectiva de compra/venta, ranking, spreads, transferencia, montos inválidos y activos incompatibles. `tests/e2e/arbitrage-radar.spec.ts` usa fixtures aisladas de producción para pantalla, sidebar, estados, filtros, calculadora, temas, responsive, consola y overflow. `scripts/smoke-arbitrage-sources.ts` consulta fuentes reales por separado y nunca bloquea la suite determinística.

## 18. Limitaciones

Las fuentes públicas pueden cambiar estructura o disponibilidad. La cotización publicada puede diferir del precio final. Los costos, límites, horarios, titularidad y acreditación no siempre están publicados. CriptoYa es un agregador: aunque aporta epoch de observación y precios `totalAsk`/`totalBid` para el volumen consultado, no confirma capacidades operativas, red de retiro ni todos los costos. Las cotizaciones continúan como referencias y no se modelaron conversiones intermedias ni liquidación MEP.

## 19. Archivos del módulo

- `app/radar-arbitraje/page.tsx` y `app/api/arbitrage/quotes/route.ts`.
- `components/arbitrage/*`.
- `lib/arbitrage/*` y `lib/arbitrage/adapters/*`.
- `tests/arbitrage/*` y `tests/e2e/arbitrage-radar.spec.ts`.
- `docs/arbitrage-radar.md` y `docs/arbitrage-data-sources.md`.
- Integraciones acotadas en `components/layout/Sidebar.tsx`, `lib/i18n/translations.ts` y `package.json`.

## 20. Próximas fases

Confirmar mediante documentación contractual las comisiones y límites de Plus, Banco Nación y Fiwind; agregar adapters sólo cuando exista una fuente pública legítima y estable; modelar rutas con conversiones intermedias; y, en otra tarea independiente, diseñar preferencias o alertas sin ejecutar operaciones.
