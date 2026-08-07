# Fuentes de datos del Radar de Arbitraje

Investigación y verificación técnica actualizada el 6 de agosto de 2026. “Registrado” significa que el proveedor aparece con estado visible; no significa que tenga cotización integrada.

| Proveedor | Instrumento | Fuente | Tipo de acceso | Actualización | Estado | Costos conocidos | Límites conocidos | Limitaciones |
|---|---|---|---|---|---|---|---|---|
| Plus | USD bancario / agencia de cambio | [Página pública Operar](https://plus.com.ar/operar/) y `https://api.plus.com.ar/currencies?front-web=true` | Endpoint JSON público con encabezados del sitio público | `date` es la hora local publicada de la cotización; caché CMA 60 s | Integrado; stale cuando supera la política de frescura | La página publica operación sin comisión adicional; se conserva advertencia de verificar precio final | Se muestran dentro de la plataforma, no en el payload público | `sell` es lo que paga el usuario al comprar y `buy` lo que recibe al vender. No se verificó disponibilidad 24/7, por lo que se eliminó esa etiqueta. Una cotización stale se muestra como referencia y no genera oportunidad activa |
| Banco Nación | USD billete/bancario | [Pizarra pública BNA](https://www.bna.com.ar/Empresas) | HTML público, sin sesión | Fecha y hora de pizarra; caché CMA 300 s | Integrado | No verificados para una ruta completa | No informados en la pizarra | Horario limitado; `Compra`/`Venta` se publican desde la perspectiva del banco y se normalizan |
| Banco Ciudad, Banco Hipotecario, Banco Provincia y Banco Supervielle | USD bancario | [API pública ComparaDólar](https://api.comparadolar.ar/usd) y [documentación](https://comparadolar.ar/docs/introduction.html) | Agregador JSON público | La respuesta se cachea 60 s, pero el endpoint de cotización actual no entrega hora de observación | Integrados como referencia | No verificados | No informados | `ask` es “Comprás a” y `bid` es “Vendés a”. Sin `observedAt` no se presentan como vigentes ni como rutas confirmadas |
| Ualá, Reba y Balanz | USD bancario | [API pública ComparaDólar](https://api.comparadolar.ar/usd) | Agregador JSON público | Igual que la fila anterior | Integrados como referencia | No verificados | No informados | La capacidad de depósito/retiro y la operatividad del monto no se infieren del precio agregado |
| Belo | USDT y USDC | [CriptoYa Argentina](https://docs.criptoya.com/argentina/) | Agregador JSON público, volumen de referencia 1.000 | Epoch `time`; actualización declarada cada minuto; caché CMA 60 s | Integrado como referencia | `totalAsk`/`totalBid` se usan como precios efectivos informados, pero otros costos siguen sin verificar | No informados | No se confirman depósito, retiro ni red compatible desde la cotización; no genera oportunidad verificada |
| DolarApp | USDC | [CriptoYa Argentina](https://docs.criptoya.com/argentina/) | Agregador JSON público, volumen de referencia 1.000 | Epoch `time`; actualización declarada cada minuto; caché CMA 60 s | Integrado como referencia | Costos completos no verificados | No informados | USDC permanece separado de USD bancario y USDT; la cotización no confirma capacidades externas |
| Satoshi Tango | USDT y USDC | [CriptoYa Argentina](https://docs.criptoya.com/argentina/) | Agregador JSON público, volumen de referencia 1.000 | Epoch `time`; actualización declarada cada minuto; caché CMA 60 s | Integrado como referencia | `totalAsk`/`totalBid` pueden diferir de `ask`/`bid`; retiro y transferencia no quedan totalmente cubiertos | No informados | La referencia por volumen no reemplaza la confirmación final del proveedor |
| Fiwind | USDT/USDC contra ARS y circuito compuesto USD → USDT → ARS | [CriptoYa Argentina](https://docs.criptoya.com/argentina/), [ComparaDólar](https://api.comparadolar.ar/usd), [conversión oficial](https://help.fiwind.io/es/articles/8042234-como-convierto-pesos-por-dolares-en-un-solo-paso), [depósitos USD](https://help.fiwind.io/es/articles/11534633-como-deposito-dolares-en-mi-cuenta-fiwind) y [titularidad](https://help.fiwind.io/es/articles/10136149-puedo-recibir-y-enviar-dolares-americanos-desde-y-hacia-cuentas-de-terceros) | Cotizaciones agregadas públicas; el precio oficial directo continúa detrás del login | CriptoYa aporta epoch para stablecoins. ComparaDólar no aporta hora de observación para `/usd`; caché CMA 60 s | Integrado como referencia, no como oportunidad verificada | Costos de la doble conversión y monto final no verificados | Dependientes del nivel de cuenta | Fiwind documenta que USD → ARS se ejecuta automáticamente como USD → USDT → ARS. CMA lo modela como destino de USD bancario, pero con frescura no verificable y resultado únicamente bruto/informativo |
| Galicia | No integrado | [Sitio público](https://www.galicia.ar/personas) | Página pública | No disponible | No integrado | No verificados | No verificados | No se confirmó una fuente pública estable apta para este módulo |
| Santander Argentina | No integrado | [Sitio público](https://www.santander.com.ar/) | Página pública | No disponible | No integrado | No verificados | No verificados | No se confirmó una fuente pública estable apta para este módulo |
| BBVA Argentina | No integrado | [Sitio público](https://www.bbva.com.ar/) | Página pública | No disponible | No integrado | No verificados | No verificados | No se confirmó una fuente pública estable apta para este módulo |
| Brubank | No integrado | [Dólar oficial](https://www.brubank.com/dolar-oficial) | Página pública comercial | Sin timestamp verificable | Descartado | Publica operación sin comisión | No verificados | El valor visible no aporta una política de actualización o feed estable verificable |
| Banco Macro | No integrado | [Compra de dólares](https://www.macro.com.ar/personas/inversiones/compra-dolares) | La cotización operativa se consulta en app/home banking | No disponible públicamente | Descartado | Publica operación sin comisión | Visibles dentro de la app | No se integra una cotización que exige acceso autenticado |
| BCRA | Referencia oficial, no venue | [APIs del Banco Central](https://www.bcra.gob.ar/apis-banco-central/) | API oficial pública | Según la serie oficial | Investigado, no usado para arbitraje entre proveedores | No aplica | No aplica | Es referencia/serie oficial y no una cotización directamente operable en una plataforma destino |
| Dolarito | Referencia de investigación | [Cotizaciones](https://www.dolarito.ar/) y [solicitud de API](https://www.dolarito.ar/solicitud-acceso-api) | La API requiere suscripción y credenciales | No evaluable sin acceso contratado | No integrado | No aplica | No aplica | No se raspa el sitio ni se eluden las condiciones de acceso; se usó sólo para contrastar cobertura y perspectiva de etiquetas |

## Criterios de integración

- Sólo se consultan fuentes públicas sin login, cookies del usuario ni credenciales financieras.
- Plus y BNA aportan quotes de USD bancario con perspectiva normalizada. Plus no se clasifica como 24×7.
- CriptoYa aporta referencias separadas de USDT y USDC mediante dos consultas públicas. La documentación declara actualización cada minuto y límite de 120 solicitudes por minuto; CMA realiza como máximo dos consultas por ciclo de caché.
- ComparaDólar aporta una lista curada de referencias de USD. Su API pública no incluye timestamp en `/usd`: `fetchedAt` sólo indica cuándo consultó CMA y nunca reemplaza `observedAt`. Estas filas quedan con frescura no verificable y nivel `reference_only`.
- La validación descarta pares invertidos, números inválidos y cotizaciones fuera de una banda de plausibilidad respecto de la mediana del payload. Brubank no se integró porque el feed observado devolvió valores con escala incorrecta; el repositorio público de ComparaDólar también lo mantiene en su lista de exclusión junto con BBVA.
- `totalAsk` y `totalBid` se normalizan como precio efectivo reportado para un volumen de referencia de 1.000 unidades. Costos de retiro, red, conversión y acreditación permanecen no verificados.
- Un proveedor sin fuente confirmada queda visible como no disponible o no integrado y jamás recibe una cotización simulada en producción.
- Los fixtures con precios están limitados a pruebas automatizadas.

## Caso Plus → Fiwind

La compatibilidad conceptual quedó confirmada, no la rentabilidad neta. Plus entrega `USD_BANK`; Fiwind documenta depósitos/retiros USD de la misma titularidad y explica oficialmente que la conversión USD → ARS se ejecuta en un paso mediante **USD → USDT → ARS**. ComparaDólar publica para `fiwind-cripto` un `ask` y un `bid` efectivos en ARS, que CMA normaliza como instrumento `crypto_usd_route` conservando `USD_BANK` como activo transferido.

La ruta puede compararse y mostrar una diferencia bruta, pero no se declara operativa o verificada: la referencia agregada no tiene timestamp de observación, los costos y límites de la doble conversión no están confirmados y el precio final depende de la app. Una diferencia negativa se muestra como tal; una positiva sigue siendo **posible diferencia bruta**, nunca ganancia neta.

## Investigación de endpoints Fiwind

La página pública del panel expone como configuración `https://api.fiwind.io/v1.0`, pero las rutas oficiales de precios consultadas sin sesión (`/prices/currencies` y `/prices/categories`) respondieron 401 por falta de Bearer token. No se usaron cuentas, cookies, sesiones ni credenciales. La integración usa CriptoYa para USDT/USDC y ComparaDólar para el circuito efectivo de USD, siempre como referencias informativas. La mecánica de conversión se apoya en documentación oficial de Fiwind, no en una inferencia del agregador.

## API de ComparaDólar evaluada

- `GET https://api.comparadolar.ar/usd`: endpoint integrado; respuesta pública con CORS abierto y caché pública de 60 segundos.
- Esquema relevante: `slug`, `name`, `bid`, `ask`, `is24x7`, `isBank`, `url` y `logoUrl`. `ask` equivale a “Comprás a” y `bid` a “Vendés a”.
- El endpoint actual no entrega timestamp. Los timestamps del historial representan registros/cambios y no se reutilizan como hora de observación de una cotización actual.
- Se integró una lista explícita de proveedores comprobados; no se incorporan automáticamente todos los slugs nuevos del agregador.
- `/usdt` y `/usdc` fueron evaluados, pero CriptoYa se conserva como fuente de stablecoins porque informa precios efectivos para volumen y un epoch de observación.

## Endpoints de CriptoYa evaluados

- `GET /api/USDT/ARS/1000` y `GET /api/USDC/ARS/1000`: integrados para Belo, DolarApp, Fiwind y Satoshi Tango.
- `GET /api/fees`: investigado; no integrado al cálculo porque la comisión depende de una red que el modelo de rutas todavía no selecciona.
- `GET /api/bancostodos`: investigado; no integrado. La muestra real combinó datos frescos con timestamps históricos para Santander, Galicia, Macro y Brubank, y las capacidades bancarias siguen sin verificarse desde el agregador.
- `GET /api/dolar`, `/api/cer` y `/api/uva`: integrados en la capa general de referencias de mercado, no como rutas de arbitraje. El dólar usa selección por categoría con DolarAPI como fallback; CER/UVA conservan BCRA como fuente primaria oficial.
