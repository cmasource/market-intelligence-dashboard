# Fuentes de datos del Radar de Arbitraje

Investigación y verificación técnica actualizada el 5 de agosto de 2026. “Registrado” significa que el proveedor aparece con estado visible; no significa que tenga cotización integrada.

| Proveedor | Instrumento | Fuente | Tipo de acceso | Actualización | Estado | Costos conocidos | Límites conocidos | Limitaciones |
|---|---|---|---|---|---|---|---|---|
| Plus | USD 24/7 | [Página pública Operar](https://plus.com.ar/operar/) y `https://api.plus.com.ar/currencies?front-web=true` | Endpoint JSON público con encabezados del sitio público | `date` es la hora local publicada de la cotización; caché CMA 60 s | Integrado; stale en la validación real | La página publica operación sin comisión adicional; se conserva advertencia de verificar precio final | Se muestran dentro de la plataforma, no en el payload público | El 5/8 el endpoint mantenía una cotización 46 min anterior a la consulta; el parser `-03:00` era correcto. Se muestra como referencia y no genera oportunidad activa |
| Banco Nación | USD billete/bancario | [Pizarra pública BNA](https://www.bna.com.ar/Empresas) | HTML público, sin sesión | Fecha y hora de pizarra; caché CMA 300 s | Integrado | No verificados para una ruta completa | No informados en la pizarra | Horario limitado; `Compra`/`Venta` se publican desde la perspectiva del banco y se normalizan |
| Belo | USDT y USDC | [CriptoYa Argentina](https://docs.criptoya.com/argentina/) | Agregador JSON público, volumen de referencia 1.000 | Epoch `time`; actualización declarada cada minuto; caché CMA 60 s | Integrado como referencia | `totalAsk`/`totalBid` se usan como precios efectivos informados, pero otros costos siguen sin verificar | No informados | No se confirman depósito, retiro ni red compatible desde la cotización; no genera oportunidad verificada |
| DolarApp | USDC | [CriptoYa Argentina](https://docs.criptoya.com/argentina/) | Agregador JSON público, volumen de referencia 1.000 | Epoch `time`; actualización declarada cada minuto; caché CMA 60 s | Integrado como referencia | Costos completos no verificados | No informados | USDC permanece separado de USD bancario y USDT; la cotización no confirma capacidades externas |
| Satoshi Tango | USDT y USDC | [CriptoYa Argentina](https://docs.criptoya.com/argentina/) | Agregador JSON público, volumen de referencia 1.000 | Epoch `time`; actualización declarada cada minuto; caché CMA 60 s | Integrado como referencia | `totalAsk`/`totalBid` pueden diferir de `ask`/`bid`; retiro y transferencia no quedan totalmente cubiertos | No informados | La referencia por volumen no reemplaza la confirmación final del proveedor |
| Fiwind | USDT y USDC contra ARS; capacidades USD documentadas por separado | [CriptoYa Argentina](https://docs.criptoya.com/argentina/), [Convertir](https://www.fiwind.io/convertir), [depósitos USD](https://help.fiwind.io/es/articles/11534633-como-deposito-dolares-en-mi-cuenta-fiwind) y [titularidad](https://help.fiwind.io/es/articles/10136149-puedo-recibir-y-enviar-dolares-americanos-desde-y-hacia-cuentas-de-terceros) | Cotización agregada pública; la cotización oficial directa continúa detrás del login | Epoch `time`; actualización declarada cada minuto; caché CMA 60 s | Integrado como referencia de stablecoins | CriptoYa informa precios efectivos por volumen; costos de conversión/retiro completos no verificados | Dependientes del nivel de cuenta | No es una cotización de USD bancario. La presencia de USDT/USDC no confirma depósito externo ni vuelve operable la ruta Plus → Fiwind |
| Galicia | No integrado | [Sitio público](https://www.galicia.ar/personas) | Página pública | No disponible | No integrado | No verificados | No verificados | No se confirmó una fuente pública estable apta para este módulo |
| Santander Argentina | No integrado | [Sitio público](https://www.santander.com.ar/) | Página pública | No disponible | No integrado | No verificados | No verificados | No se confirmó una fuente pública estable apta para este módulo |
| BBVA Argentina | No integrado | [Sitio público](https://www.bbva.com.ar/) | Página pública | No disponible | No integrado | No verificados | No verificados | No se confirmó una fuente pública estable apta para este módulo |
| Brubank | No integrado | [Dólar oficial](https://www.brubank.com/dolar-oficial) | Página pública comercial | Sin timestamp verificable | Descartado | Publica operación sin comisión | No verificados | El valor visible no aporta una política de actualización o feed estable verificable |
| Banco Macro | No integrado | [Compra de dólares](https://www.macro.com.ar/personas/inversiones/compra-dolares) | La cotización operativa se consulta en app/home banking | No disponible públicamente | Descartado | Publica operación sin comisión | Visibles dentro de la app | No se integra una cotización que exige acceso autenticado |
| BCRA | Referencia oficial, no venue | [APIs del Banco Central](https://www.bcra.gob.ar/apis-banco-central/) | API oficial pública | Según la serie oficial | Investigado, no usado para arbitraje entre proveedores | No aplica | No aplica | Es referencia/serie oficial y no una cotización directamente operable en una plataforma destino |

## Criterios de integración

- Sólo se consultan fuentes públicas sin login, cookies del usuario ni credenciales financieras.
- Plus y BNA aportan quotes de USD bancario/24×7 con perspectiva normalizada.
- CriptoYa aporta referencias separadas de USDT y USDC mediante dos consultas públicas. La documentación declara actualización cada minuto y límite de 120 solicitudes por minuto; CMA realiza como máximo dos consultas por ciclo de caché.
- `totalAsk` y `totalBid` se normalizan como precio efectivo reportado para un volumen de referencia de 1.000 unidades. Costos de retiro, red, conversión y acreditación permanecen no verificados.
- Un proveedor sin fuente confirmada queda visible como no disponible o no integrado y jamás recibe una cotización simulada en producción.
- Los fixtures con precios están limitados a pruebas automatizadas.

## Caso Plus → Fiwind

La ruta original no pudo verificarse de extremo a extremo. Plus transfiere USD bancarios y Fiwind documenta depósitos/retiros USD de la misma titularidad. CriptoYa agrega cotizaciones Fiwind de **USDT/USDC contra ARS**, no una cotización de USD bancario ni la conversión interna completa. Por lo tanto el activo de la cotización no coincide con el USD que sale de Plus; además faltan límites, costos completos y plazo efectivo. La ruta permanece incompatible/informativa y no se simula una oportunidad.

## Investigación de endpoints Fiwind

La página pública del panel expone como configuración `https://api.fiwind.io/v1.0`, pero las rutas oficiales de precios consultadas sin sesión (`/prices/currencies` y `/prices/categories`) respondieron 401 por falta de Bearer token. No se usaron cuentas, cookies, sesiones ni credenciales. La nueva integración usa exclusivamente la API pública agregada de CriptoYa y se etiqueta como referencia informativa.

## Endpoints de CriptoYa evaluados

- `GET /api/USDT/ARS/1000` y `GET /api/USDC/ARS/1000`: integrados para Belo, DolarApp, Fiwind y Satoshi Tango.
- `GET /api/fees`: investigado; no integrado al cálculo porque la comisión depende de una red que el modelo de rutas todavía no selecciona.
- `GET /api/bancostodos`: investigado; no integrado. La muestra real combinó datos frescos con timestamps históricos para Santander, Galicia, Macro y Brubank, y las capacidades bancarias siguen sin verificarse desde el agregador.
- `GET /api/dolar`, `/api/cer` y `/api/uva`: integrados en la capa general de referencias de mercado, no como rutas de arbitraje. El dólar usa selección por categoría con DolarAPI como fallback; CER/UVA conservan BCRA como fuente primaria oficial.
