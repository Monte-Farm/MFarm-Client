# Especificación de Endpoints — Reportes PDF Operativos

Todos los endpoints retornan `application/pdf` (binario).
Orientación por defecto: `landscape`. Formato por defecto: `A4`.

Query params opcionales en todos: `orientation` (`portrait` | `landscape`), `format` (`A4` | `Letter`).

---

## GET /reports/purchase_orders/range

**Página:** `/purchase_orders/view_purchase_orders`

| Param | Req | Descripción |
|-------|-----|-------------|
| `start_date` | ✅ | Fecha inicio (YYYY-MM-DD) |
| `end_date` | ✅ | Fecha fin (YYYY-MM-DD) |
| `farm_id` | ✅ | ID de la granja |

**Tabla:** código de orden, fecha, proveedor, cantidad de productos, monto total, estado (Pendiente / Ingresada).
**Pie:** total de órdenes · órdenes pendientes · monto total del período.

---

## GET /reports/incomes/range

**Página:** `/warehouse/incomes/view_incomes`

| Param | Req | Descripción |
|-------|-----|-------------|
| `start_date` | ✅ | Fecha inicio |
| `end_date` | ✅ | Fecha fin |
| `farm_id` | ✅ | ID de la granja |

**Tabla:** ID entrada, fecha, origen, tipo de entrada (Compra / Donación / Transferencia interna / Producción propia), precio total.
**Pie:** total de entradas · valor total · valor promedio por entrada.

---

## GET /reports/outcomes/range

**Página:** `/warehouse/outcomes/view_outcomes`

| Param | Req | Descripción |
|-------|-----|-------------|
| `start_date` | ✅ | Fecha inicio |
| `end_date` | ✅ | Fecha fin |
| `farm_id` | ✅ | ID de la granja |

**Tabla:** código, fecha, tipo de salida (Transferencia / Venta / Pérdida / Ajuste / Devolución / Consumo / Orden de almacén), subalmacén destino, valor total.
**Pie:** total de salidas · valor total · valor promedio por salida.

---

## GET /reports/suppliers/all

**Página:** `/warehouse/suppliers/view_suppliers`

| Param | Req | Descripción |
|-------|-----|-------------|
| `farm_id` | ✅ | ID de la granja |

**Tabla:** código, nombre, categoría, teléfono, dirección, estado (Activo / Inactivo).
**Pie:** total de proveedores · activos · inactivos · tasa de activación.

---

## GET /reports/products/all

**Página:** `/warehouse/products/product_catalog`

> Sin `farm_id` — catálogo global de todos los productos del sistema.

**Tabla:** código, nombre, categoría, tipo (Materia Prima / Alimento Preparado), unidad de medida, estado (Activo / Inactivo).
**Pie:** total de productos · activos · inactivos · tasa de activación.

---

## GET /reports/subwarehouses/all

**Página:** `/subwarehouse/view_subwarehouse`

| Param | Req | Descripción |
|-------|-----|-------------|
| `farm_id` | ✅ | ID de la granja |

**Tabla:** código, nombre, responsable (nombre + apellido), tipo (Médico / Alimento / Limpieza / Insumos), estado (Activo / Inactivo).
**Pie:** total de subalmacenes · activos · inactivos · tasa de activación.

---

## GET /reports/pig_sales/range

**Página:** `/sale/view_pig_sales`

| Param | Req | Descripción |
|-------|-----|-------------|
| `start_date` | ✅ | Fecha inicio |
| `end_date` | ✅ | Fecha fin |
| `farm_id` | ✅ | ID de la granja |

**Tabla:** código, fecha, comprador, cantidad de cerdos, peso total (kg), monto total, método de pago (Efectivo / Transferencia / Cheque / Crédito / Otro), estado de pago (Pendiente / Parcial / Completado).
**Pie:** total de ventas · peso total · monto total del período.

---

## GET /reports/expenses/range

**Página:** `/expenses/view_expenses`

| Param | Req | Descripción |
|-------|-----|-------------|
| `start_date` | ✅ | Fecha inicio |
| `end_date` | ✅ | Fecha fin |
| `farm_id` | ✅ | ID de la granja |

> Solo incluye `FinancialEntry` con `sourceModule = MANUAL` y `type = COST`.

**Tabla:** fecha, categoría (Sueldos / Servicios / Mantenimiento / Transporte / Compra de ganado / Veterinario / Otro), descripción (`metadata.description`), monto, registrado por.
**Pie:** total de registros · gasto total · gasto promedio.

---

## GET /reports/discarded_pigs/range

**Página:** `/pigs/discarded_pigs`

| Param | Req | Descripción |
|-------|-----|-------------|
| `start_date` | ✅ | Fecha inicio (filtra por `discard.date`) |
| `end_date` | ✅ | Fecha fin |
| `farm_id` | ✅ | ID de la granja |

**Tabla:** código, raza, fecha de nacimiento, sexo, etapa (Lechón / Destete / Engorda / Reproductor), peso (kg), estado (Descartado / Muerto).
**Pie:** total de cerdos en el período.

---

## GET /reports/semen_samples/all

**Página:** `/laboratory/samples/view_samples`

| Param | Req | Descripción |
|-------|-----|-------------|
| `farm_id` | ✅ | ID de la granja |

**Tabla:** lote (`extraction_id.batch`), código del verraco, dosis totales, dosis disponibles, fecha de expiración, método de conservación, técnico responsable, estado del lote (Disponible / Por Expirar / Expirado / Sin dosis / Descartado).
**Pie:** total de lotes · disponibles · por expirar · expirados · descartados.

---

## GET /reports/litters/range

**Página:** `/lactation/view_litters`

| Param | Req | Descripción |
|-------|-----|-------------|
| `start_date` | ✅ | Fecha inicio (filtra por `birthDate`) |
| `end_date` | ✅ | Fecha fin |
| `farm_id` | ✅ | ID de la granja |

**Tabla:** código, fecha de nacimiento, código de la madre, machos actuales, hembras actuales, peso promedio (kg), peso total (`averageWeight × (currentMale + currentFemale)`), estado (Lactando / Listo para destetar / Destetada / Destete vencido).
**Pie:** total de camadas · total machos · total hembras.

---

## GET /reports/groups/weaned/range

**Página:** `/groups/view_weaned_groups`

| Param | Req | Descripción |
|-------|-----|-------------|
| `start_date` | ✅ | Fecha inicio (filtra por `creationDate`) |
| `end_date` | ✅ | Fecha fin |
| `farm_id` | ✅ | ID de la granja |

> Filtra grupos con etapa `weaning`.

**Tabla:** código, fecha de creación, machos actuales, hembras actuales, peso promedio (kg), estado.
**Pie:** total de grupos · total machos · total hembras.

---

## GET /reports/groups/growing/range

**Página:** `/groups/view_growing_groups`

| Param | Req | Descripción |
|-------|-----|-------------|
| `start_date` | ✅ | Fecha inicio (filtra por `creationDate`) |
| `end_date` | ✅ | Fecha fin |
| `farm_id` | ✅ | ID de la granja |

> Filtra grupos con etapa `fattening`.

**Tabla:** código, nombre, área/corral, fecha de creación, machos actuales, hembras actuales, peso promedio (kg), estado.
**Pie:** total de grupos · total machos · total hembras.

---

## GET /reports/feeding_packages/range

**Página:** `/feeding/view_feeding_packages`

| Param | Req | Descripción |
|-------|-----|-------------|
| `start_date` | ✅ | Fecha inicio (filtra por `creation_date`) |
| `end_date` | ✅ | Fecha fin |
| `farm_id` | ✅ | ID de la granja |

**Tabla:** código, nombre, fecha de creación, responsable, etapa (General / Lechón / Destete / Engorda / Reproductor), estado (Activo / Inactivo).
**Pie:** total de recetas · activas · inactivas.

---

## GET /reports/feed_preparations/range

**Página:** `/feeding/view_feed_preparations`

| Param | Req | Descripción |
|-------|-----|-------------|
| `start_date` | ✅ | Fecha inicio (filtra por `preparationDate`) |
| `end_date` | ✅ | Fecha fin |
| `farm_id` | ✅ | ID de la granja |

**Tabla:** código, receta (`recipe.code - recipe.name`), fecha, mezcla preparada (kg), producido real (kg), merma (%), costo total ($), costo por kg ($), responsable.
**Pie:** total de preparaciones · total kg producidos · costo total del período.
