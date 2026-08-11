# Radar de Arbitraje

## 1. Objetivo

Radar de Arbitraje compara cotizaciones públicas normalizadas desde la perspectiva del usuario para detectar diferencias informativas entre una compra y una venta de dólares. No promete resultados ni sustituye la verificación final en cada proveedor.

## 2. Alcance

La interfaz organiza primero por activo y muestra ambas puntas en una tarjeta por proveedor. El análisis de rutas y la calculadora quedan restringidos al activo seleccionado, junto con frescura, trazabilidad, compatibilidad operativa y resultados brutos o netos según la confianza de los costos.

## 3. Funciones excluidas

No ejecuta operaciones, transferencias ni órdenes; no conecta cuentas; no automatiza logins ni almacena credenciales o cookies externas. Las alertas configuradas por usuarios autenticados sólo guardan el activo, la comparación opcional y el umbral de diferencia por USD. Tampoco reutiliza `/api/research/wallet-rates`, que corresponde a rendimientos de cuentas.

## 4. Arquitectura

La ruta pública `/radar-arbitraje` usa un componente cliente para interacción y consume `/api/arbitrage/quotes`. El backend coordina adapters server-side para Plus, Banco Nación, CriptoYa y ComparaDólar. El dominio en `lib/arbitrage` mantiene separados registro de proveedores, adapters, normalización, frescura, compatibilidad y cálculo puro. Las cotizaciones sólo se conservan en una caché efímera del proceso.

## 5. Normalización de compra y venta

`userBuysUsdAt` representa los ARS que paga el usuario por USD 1 y `userSellsUsdAt` los ARS que recibe al vender USD 1. Los adapters invierten los campos cuando la fuente publica desde la perspectiva de la entidad y conservan `originalBuyLabel` y `originalSellLabel` para trazabilidad.

## 6. Modelo de proveedores

`FxProvider` registra tipo, sitio, disponibilidad 24/7, capacidades de depósito/retiro por activo, requisito de misma titularidad, tipo de fuente y estado. Un proveedor investigado pero sin fuente pública estable permanece `temporarily_unavailable` o `unsupported`; su presencia en el registro no implica integración.

## 7. Modelo de cotizaciones

`FxQuote` identifica proveedor, instrumento (`bank_usd`, `mep`, `usdt`, `usdc`, `crypto_usd_route`, entre otros), activo transferido (`USD_BANK`, `USDT` o `USDC`), precios normalizados, etiquetas originales, observación, obtención, fuente, estado, costos, límites y advertencias. Plus se normaliza como `bank_usd`; no existe evidencia pública suficiente para etiquetarlo como “Dólar 24/7”. `crypto_usd_route` identifica el circuito documentado de Fiwind USD → USDT → ARS sin confundirlo con una cotización directa de stablecoin transferible.

## 8. Compatibilidad

Una ruta se bloquea cuando usa el mismo proveedor, faltan precios, los activos no coinciden, una fuente está vencida, un proveedor no está activo, no se puede retirar o depositar el activo, la capacidad no fue verificada o el monto incumple límites informados. La misma titularidad se expone como requisito/advertencia. USD bancario, USDT y USDC no se mezclan implícitamente. La única conversión compuesta explícita es Fiwind `crypto_usd_route`: el activo que llega sigue siendo USD bancario y la conversión interna USD → USDT → ARS se documenta y rotula de forma visible.

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

El resumen principal permite crear una alerta por diferencia de cotización. La suscripción general no queda atada a la ruta visible ni al monto de la calculadora: el monitor revisa todas las comparaciones del activo cada cinco minutos y avisa por los canales habilitados cuando la mayor diferencia bruta por USD alcanza el umbral configurado. También puede seguirse una comparación específica desde la calculadora. En ambos casos el aviso comunica una diferencia bruta reciente, no una ganancia neta ni una operación garantizada; el monto, los costos y los límites se analizan por separado en la calculadora.

## 10. Costos

El modelo contempla cargos fijos en ARS, porcentuales, fijos en USD y costos de transferencia. Cada costo se clasifica como confirmado, estimado o desconocido. Si falta información, la UI muestra “Costos no verificados” y sólo comunica una diferencia o ganancia bruta estimada; no afirma una ganancia neta.

## 11. Límites

Se admiten mínimo, máximo por operación, máximo diario y máximo mensual. Los adapters no inventan límites. Un límite ausente se muestra como no informado y un monto fuera de rango bloquea la ruta.

## 12. Frescura

Cada quote separa `observedAt` (hora publicada por la fuente, si existe) de `fetchedAt` (hora de consulta de CMA). Los umbrales son configurables por proveedor: Plus usa 120 segundos como fresco y 600 como vencido; Banco Nación, por la naturaleza de su pizarra, 4 y 12 horas. Una cotización vencida puede verse, pero no genera oportunidades activas. Cuando un agregador no entrega hora original, `observedAt` queda ausente: `fetchedAt` nunca se usa para simular la hora de la fuente. La alerta de diferencia admite una consulta CMA con antigüedad máxima de cinco minutos, lo declara en la evidencia y no la presenta como verificación de rentabilidad u operabilidad.

La validación real del 5 de agosto de 2026 encontró en Plus el campo `date: "2026-08-05 13:54:02"` mientras la consulta se realizó a las `14:39:41` de Argentina. El parser interpreta correctamente la fecha local con `-03:00`; la fuente estaba realmente atrasada unos 46 minutos. Se conserva `stale` y la cotización queda sólo como referencia.

## 13. Caché

La caché server-side es efímera y diferenciada: Plus 60 segundos, Banco Nación 300 segundos, CriptoYa 60 segundos y ComparaDólar 60 segundos. El adapter de CriptoYa consulta USDT y USDC en paralelo y respeta ampliamente su límite público de 120 solicitudes por minuto. ComparaDólar se consulta una vez por ciclo para sus referencias USD curadas. Se deduplican solicitudes concurrentes. Ante un fallo se reutiliza el último valor válido únicamente como `stale_fallback`, marcado desactualizado. No hay polling por segundo; la actualización manual usa `refresh=1`.

## 14. Endpoint

`GET /api/arbitrage/quotes` ejecuta los adapters con timeout individual y `Promise.allSettled`, por lo que una fuente caída no derriba las restantes. Devuelve quotes normalizados, estado de cada proveedor, TTL y disclaimer. Los fallos externos se reducen a códigos seguros sin filtrar detalles internos.

## 15. Interfaz

La pantalla conserva AppShell, navegación e internacionalización existentes y adopta el flujo visual aprobado de tarjetas por proveedor. Las pestañas `USD bancario`, `USDT` y `USDC` determinan todo el contenido inferior. Cada tarjeta muestra juntas “Comprás” y “Vendés”, identidad del proveedor, instrumento, verificación, volumen y fuente. Si la fuente carece de hora original, la tarjeta prioriza una señal discreta de “Consulta CMA” con su antigüedad y deja el detalle de procedencia en Estado de fuentes; una consulta atrasada sí conserva una advertencia visible. Fiwind añade una explicación visible del circuito USD → USDT → ARS. El panel de rutas sustituye el cruce completo por las cuatro mejores combinaciones del mismo activo; la calculadora excluye el mismo proveedor como destino. Los estados principales son “Oportunidad verificada”, “Posible diferencia bruta”, “Sin oportunidades verificadas” y “Datos insuficientes”. En mobile todo se apila sin scroll horizontal de página. La simulación inicial es 1.000 unidades y no se persiste.

## 16. Seguridad

Todas las consultas externas se hacen en servidor a fuentes públicas verificadas. No se incorporaron variables de entorno ni cambios en `.env.local`; no se usan secretos, service role, cookies externas ni endpoints autenticados. El sistema de Supabase Auth no fue modificado y la página es pública.

## 17. Pruebas

`tests/arbitrage` cubre adapters, payload real sanitizado de Plus, zona horaria Argentina, separación `observedAt`/`fetchedAt`, fuente sin timestamp, stale real, normalización y descarte de valores anómalos de ComparaDólar, circuito compuesto de Fiwind, niveles de verificación, costos y límites desconocidos, perspectiva de compra/venta, ranking, spreads, transferencia, montos inválidos y activos incompatibles. `tests/e2e/arbitrage-radar.spec.ts` usa fixtures aisladas de producción para pantalla, sidebar, estados, filtros, calculadora, temas, responsive, consola y overflow. `scripts/smoke-arbitrage-sources.ts` consulta las cuatro fuentes reales por separado y nunca bloquea la suite determinística.

## 18. Limitaciones

Las fuentes públicas pueden cambiar estructura o disponibilidad. La cotización publicada puede diferir del precio final. Los costos, límites, horarios, titularidad y acreditación no siempre están publicados. CriptoYa es un agregador: aunque aporta epoch de observación y precios `totalAsk`/`totalBid` para el volumen consultado, no confirma capacidades operativas, red de retiro ni todos los costos. ComparaDólar amplía cobertura bancaria, pero su endpoint actual no entrega timestamp y sus datos permanecen `reference_only`. Dolarito no se integró porque su API requiere suscripción y credenciales. La conversión compuesta de Fiwind se modeló únicamente para explicar y comparar su circuito documentado; todavía no confirma costos o resultado neto. No se modeló liquidación MEP.

## 19. Archivos del módulo

- `app/radar-arbitraje/page.tsx` y `app/api/arbitrage/quotes/route.ts`.
- `components/arbitrage/*`.
- `lib/arbitrage/*` y `lib/arbitrage/adapters/*`.
- `tests/arbitrage/*` y `tests/e2e/arbitrage-radar.spec.ts`.
- `docs/arbitrage-radar.md` y `docs/arbitrage-data-sources.md`.
- Integraciones acotadas en `components/layout/Sidebar.tsx`, `lib/i18n/translations.ts` y `package.json`.

## 20. Próximas fases

Confirmar mediante documentación contractual las comisiones, límites y monto final de Plus, Banco Nación y Fiwind; buscar timestamp o SLA de origen para las referencias de ComparaDólar; evaluar acceso formal a Dolarito sólo si su cobertura justifica el costo; agregar adapters directos cuando exista una fuente pública legítima y estable; y, en otra tarea independiente, diseñar preferencias o alertas sin ejecutar operaciones.
