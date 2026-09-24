# LOFT76 Compras

Aplicación web (móvil) para la cocina de LOFT76:

1. **Lista**: se buscan productos y se indica la cantidad que falta.
2. **Pedido**: la app reparte la lista entre proveedores eligiendo el precio neto más bajo, redondea a cajas completas, evita pedidos a proveedores con gastos de gestión cuando no compensa y genera el texto del pedido para copiar o enviar por WhatsApp.
3. **Precios**: comparativa de todos los productos, con el proveedor más barato marcado.

Esta es la **fase 1**: los precios vienen de `data/catalog.json`, generado a partir de la revisión de facturas 2026, la tarifa de Foster de septiembre y la propuesta de Prodesco del 24/09. No hay todavía conexión con Google Drive.

## Poner en marcha

```bash
npm install
npm run dev        # http://localhost:3000
```

## Publicar en Vercel

1. Sube esta carpeta a un repositorio de GitHub (privado).
2. En vercel.com → *Add New… → Project* → importa el repositorio. No hace falta configurar nada: Vercel detecta Next.js.
3. Abre la URL en el móvil de cocina y usa *Añadir a pantalla de inicio* para tenerla como app.

## Cómo está organizado

| Carpeta | Qué contiene |
|---|---|
| `data/catalog.json` | Proveedores, ofertas (precio, unidad, descuento, fecha) y grupos de productos equivalentes |
| `lib/optimize.ts` | Lógica de reparto: más barato por producto, redondeo a cajas y agrupación para ahorrar gastos de gestión |
| `lib/catalog.ts` | Búsqueda y cálculo de precio neto por unidad base |
| `lib/store.ts` | Lista y proveedores excluidos guardados en el navegador |
| `app/` | Pantallas: Lista, Pedido y Precios |

### Modelo de datos

- **Oferta**: lo que un proveedor factura (código, nombre, unidad de precio, precio, descuento, fecha).
- **Grupo**: producto que pide la cocina (p. ej. «Nuggets de pollo», en kg). Agrupa ofertas equivalentes de distintos proveedores con su conversión a la unidad base (`qtyPerPriceUnit`) y su tamaño de caja (`pack`).
- Hay 28 grupos con varios proveedores; el resto tiene un solo proveedor.

### Actualizar un precio (mientras no exista la fase 2)

Edita la oferta en `data/catalog.json` (campos `price`, `date` y, si aplica, `netPrice` o `discount`), haz commit y Vercel publica solo.

## Limitaciones conocidas

- La lista se guarda **en cada móvil**: dos cocineros con móviles distintos no ven la misma lista. Se resuelve en la fase 2 con base de datos.
- No se comparan calidades: las ofertas con nota «verificar», «prueba» o «pendiente» aparecen señaladas en el pedido.
- Precios de García Molinero: se usa el neto real cuando se conoce; si no, tarifa con un 8,5 % de descuento medio.
- Precios de más de 60 días se marcan para confirmar.
- Faltan pedido mínimo y días de reparto de cada proveedor (campos preparados en `suppliers`, a completar).

Ver `docs/FASE2.md` para la conexión con Google Drive.
