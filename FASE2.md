# Fase 2 – Sincronización con Google Drive

Objetivo: que los precios se actualicen solos a partir de las facturas que se suben a la carpeta «Facturas Loft76 2026».

## Componentes

| Pieza | Elección | Motivo |
|---|---|---|
| Base de datos | Postgres (Neon o Supabase, plan gratuito) | Lista compartida entre móviles, histórico de precios, equivalencias |
| Acceso a Drive | Cuenta de servicio de Google con la carpeta compartida en **solo lectura** | Sin contraseñas personales en la app |
| Lectura de facturas | Texto del PDF; OCR si es escaneo; API de Claude con salida JSON | Formatos distintos de 27 proveedores |
| Programación | Vercel Cron (plan Hobby: 1 vez al día) | Suficiente: las facturas llegan con días de retraso |

## Flujo diario

1. El cron llama a `/api/sync` (protegido con `CRON_SECRET`).
2. Se listan los PDF nuevos o modificados desde la última sincronización.
3. Cada factura se convierte en líneas: proveedor, fecha, código, descripción, cantidad, unidad, precio, descuento.
4. Cada línea se asocia a una oferta existente por proveedor + código; si no hay código, por similitud de texto.
5. Las líneas dudosas van a una **bandeja de revisión** para que Ivan confirme a qué producto corresponden.
6. Se generan alertas: subida > 5 %, cambio de marca o de formato con el mismo código, promociones que caducan.

## Tablas mínimas

- `suppliers`, `offers`, `groups`, `group_offers` (lo que hoy está en `catalog.json`)
- `invoices` (id de Drive, proveedor, fecha, estado)
- `invoice_lines` (factura, oferta asociada, cantidad, precio, estado de revisión)
- `price_history` (oferta, fecha, precio)
- `lists` y `list_items` (lista compartida de cocina)

## Variables de entorno

```
DATABASE_URL=
GOOGLE_SERVICE_ACCOUNT_JSON=
DRIVE_FOLDER_ID=
ANTHROPIC_API_KEY=
CRON_SECRET=
```

## Casos especiales conocidos

- El Maragato: la factura solo trae el total → pedir factura detallada.
- Coca-Cola: facturas en .zip y proveedor sin alternativa → fuera de la comparación.
- García Molinero: descuento distinto en cada línea → guardar precio de tarifa y neto.

## Orden recomendado

1. Base de datos + migrar `catalog.json` + lista compartida.
2. Lectura de facturas en modo prueba con Prodesco (34 facturas ya revisadas a mano para validar).
3. Pasada completa enero–septiembre + bandeja de revisión.
4. Cron diario y alertas.
