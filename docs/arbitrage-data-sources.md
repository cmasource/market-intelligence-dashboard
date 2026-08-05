# Fuentes de datos del Radar de Arbitraje

Investigación y verificación técnica realizadas el 4 de agosto de 2026. “Registrado” significa que el proveedor aparece con estado visible; no significa que tenga cotización integrada.

| Proveedor | Instrumento | Fuente | Tipo de acceso | Actualización | Estado | Costos conocidos | Límites conocidos | Limitaciones |
|---|---|---|---|---|---|---|---|---|
| Plus | USD 24/7 | [Página pública Operar](https://plus.com.ar/operar/) y endpoint usado por esa página | Endpoint JSON público con encabezados del sitio público | Campo de fecha de la fuente; caché CMA 60 s | Integrado | La página publica operación sin comisión adicional; se conserva advertencia de verificar precio final | No informados en la fuente integrada | Requiere transferencia bancaria y misma titularidad según el flujo público; disponibilidad y precio final pueden cambiar |
| Banco Nación | USD billete/bancario | [Pizarra pública BNA](https://www.bna.com.ar/Empresas) | HTML público, sin sesión | Fecha y hora de pizarra; caché CMA 300 s | Integrado | No verificados para una ruta completa | No informados en la pizarra | Horario limitado; `Compra`/`Venta` se publican desde la perspectiva del banco y se normalizan |
| Belo | USDT | [DolarApi USD/ARS](https://dolarapi.com/docs/argentina/exchanges/monedas/get-exchange-moneda-usd-ars) | Agregador JSON público | La respuesta verificada no incluyó hora original; caché CMA 60 s | Integrado como referencia parcial | No verificados | No informados | No se confirma operabilidad ni retiro/depósito desde el agregador; no genera ruta activa sin capacidades verificadas |
| DolarApp | USDC | [DolarApi USD/ARS](https://dolarapi.com/docs/argentina/exchanges/monedas/get-exchange-moneda-usd-ars) | Agregador JSON público | La respuesta verificada no incluyó hora original; caché CMA 60 s | Integrado como referencia parcial | No verificados | No informados | USDC se mantiene separado de USD bancario y USDT; no genera ruta activa sin capacidades verificadas |
| Satoshi Tango | USDT | [DolarApi USD/ARS](https://dolarapi.com/docs/argentina/exchanges/monedas/get-exchange-moneda-usd-ars) | Agregador JSON público | La respuesta verificada no incluyó hora original; caché CMA 60 s | Integrado como referencia parcial | No verificados | No informados | Puede haber lados de la cotización faltantes; no genera ruta activa sin capacidades verificadas |
| Fiwind | No integrado | [Sitio público Fiwind](https://www.fiwind.io/) | Sitio público; sin endpoint estable de cotización confirmado | No disponible | Temporalmente no disponible | No verificados | No verificados | DolarApi lista el proveedor, pero la respuesta USD/ARS verificada no contenía una fila Fiwind; no se inventa cotización |
| Galicia | No integrado | [Sitio público](https://www.galicia.ar/personas) | Página pública | No disponible | No integrado | No verificados | No verificados | No se confirmó una fuente pública estable apta para este módulo |
| Santander Argentina | No integrado | [Sitio público](https://www.santander.com.ar/) | Página pública | No disponible | No integrado | No verificados | No verificados | No se confirmó una fuente pública estable apta para este módulo |
| BBVA Argentina | No integrado | [Sitio público](https://www.bbva.com.ar/) | Página pública | No disponible | No integrado | No verificados | No verificados | No se confirmó una fuente pública estable apta para este módulo |
| BCRA | Referencia oficial, no venue | [APIs del Banco Central](https://www.bcra.gob.ar/apis-banco-central/) | API oficial pública | Según la serie oficial | Investigado, no usado para arbitraje entre proveedores | No aplica | No aplica | Es referencia/serie oficial y no una cotización directamente operable en una plataforma destino |

## Criterios de integración

- Sólo se consultan fuentes públicas sin login, cookies del usuario ni credenciales financieras.
- Plus y BNA aportan quotes de USD bancario/24×7 con perspectiva normalizada.
- DolarApi aporta referencias separadas de USDT y USDC. Su [documentación legal](https://dolarapi.com/docs/legal) indica el carácter informativo de los datos; CMA mantiene esa advertencia.
- Un proveedor sin fuente confirmada queda visible como no disponible o no integrado y jamás recibe una cotización simulada en producción.
- Los fixtures con precios están limitados a pruebas automatizadas.
