# Especificaciones de Reportes Pendientes — Backend

Endpoints que el backend debe implementar para los reportes integrados en las páginas operativas.
Todos retornan un **binario PDF** (`application/pdf`).

---

## Compras / Órdenes de Compra

### Reporte de Órdenes de Compra por Rango de Fechas

**Página:** `/purchase_orders/view_purchase_orders`
**Tipo:** PDF por rango de fechas

#### Endpoint
```
GET /reports/purchase_orders/range?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&farm_id={farmId}
```

#### Contenido esperado del PDF
- Encabezado: nombre de la granja, rango de fechas
- Tabla de órdenes:

| Campo | Descripción |
|-------|-------------|
| `code` | Número/código de la orden (ej. OC-001) |
| `date` | Fecha de la orden |
| `supplier.name` | Nombre del proveedor |
| `products.length` | Cantidad de productos distintos en la orden |
| `totalAmount` | Monto total de la orden (suma de `products[].totalPrice`) |
| `status` | `true` = No ingresada (pendiente) / `false` = Ingresada |

- Totales al pie: total de órdenes, monto total del periodo, órdenes pendientes

---

## Almacén / Inventario

### Reporte de Entradas por Rango de Fechas

**Página:** `/warehouse/incomes/view_incomes`
**Tipo:** PDF por rango de fechas

#### Endpoint
```
GET /reports/incomes/range?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&farm_id={farmId}
```

#### Contenido esperado del PDF
- Encabezado: nombre de la granja, rango de fechas
- Tabla de entradas:

| Campo | Descripción |
|-------|-------------|
| `id` | Identificador de la entrada |
| `date` | Fecha de entrada |
| `origin.id.name` | Nombre del proveedor/origen |
| `incomeType` | `purchase` = Compra, `donacion` = Donación, `internal_transfer` = Transferencia interna, `own_production` = Producción propia |
| `totalPrice` | Precio total de la entrada |

- Totales al pie: total de entradas, valor total del periodo, valor promedio por entrada

### Reporte de Salidas por Rango de Fechas

**Página:** `/warehouse/outcomes/view_outcomes`
**Tipo:** PDF por rango de fechas

#### Endpoint
```
GET /reports/outcomes/range?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&farm_id={farmId}
```

#### Contenido esperado del PDF
- Encabezado: nombre de la granja, rango de fechas
- Tabla de salidas:

| Campo | Descripción |
|-------|-------------|
| `code` | Identificador de la salida |
| `date` | Fecha de salida |
| `outcomeType` | `transfer` = Transferencia, `sale` = Venta, `loss` = Pérdida, `adjustment` = Ajuste, `return` = Devolución, `consumption` = Consumo, `warehouse_order` = Orden de Almacén |
| `warehouseDestiny.name` | Subalmacén de destino (puede ser N/A) |
| `totalPrice` | Valor total de la salida |

- Totales al pie: total de salidas, valor total del periodo, valor promedio por salida

---

## Proveedores

### Reporte de Todos los Proveedores

**Página:** `/warehouse/suppliers/view_suppliers`
**Tipo:** PDF directo (sin rango de fechas)

#### Endpoint
```
GET /reports/suppliers/all?farm_id={farmId}
```

#### Contenido esperado del PDF
- Encabezado: nombre de la granja, fecha de generación
- Tabla de todos los proveedores (activos e inactivos):

| Campo | Descripción |
|-------|-------------|
| `id` | Código del proveedor |
| `name` | Nombre del proveedor |
| `supplier_type` | Categoría (etiqueta legible, ej. "Nutrición", "Medicamentos") |
| `phone_number` | Teléfono |
| `address` | Dirección |
| `status` | `true` = Activo / `false` = Inactivo |

- Resumen al pie: total de proveedores, activos, inactivos, tasa de activación

---

## Productos

### Catálogo de Productos

**Página:** `/warehouse/products/product_catalog`
**Tipo:** PDF directo (sin rango de fechas, catálogo global)

#### Endpoint
```
GET /reports/products/all
```

#### Contenido esperado del PDF
- Encabezado: "Catálogo de Productos", fecha de generación
- Tabla de todos los productos (activos e inactivos):

| Campo | Descripción |
|-------|-------------|
| `id` | Código del producto |
| `name` | Nombre del producto |
| `category` | Categoría (etiqueta legible, ej. "Nutrición", "Medicamentos", "Vacunas") |
| `type` | Tipo (ej. "Materia Prima", "Alimento Preparado") |
| `unit_measurement` | Unidad de medida |
| `status` | `true` = Activo / `false` = Inactivo |

- Resumen al pie: total de productos, activos, inactivos, tasa de activación

---

## Subalmacenes

### Reporte de Subalmacenes

**Página:** `/subwarehouse/view_subwarehouse`
**Tipo:** PDF directo (sin rango de fechas, sin stock de inventario)

#### Endpoint
```
GET /reports/subwarehouses/all?farm_id={farmId}
```

#### Contenido esperado del PDF
- Encabezado: nombre de la granja, fecha de generación
- Tabla de subalmacenes (información básica, sin stock):

| Campo | Descripción |
|-------|-------------|
| `code` | Código del subalmacén |
| `name` | Nombre del subalmacén |
| `manager.name` + `manager.lastname` | Nombre completo del responsable |
| `type` | `medical` = Médico, `feed` = Alimento, `cleaning` = Limpieza, `supplies` = Insumos |
| `status` | `true` = Activo / `false` = Inactivo |

- Resumen al pie: total de subalmacenes, activos, inactivos, tasa de activación

---

## Ventas

### Reporte de Ventas de Cerdos por Rango de Fechas

**Página:** `/sale/view_pig_sales`
**Tipo:** PDF por rango de fechas

#### Endpoint
```
GET /reports/pig_sales/range?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&farm_id={farmId}
```

#### Contenido esperado del PDF
- Encabezado: nombre de la granja, rango de fechas
- Tabla de ventas:

| Campo | Descripción |
|-------|-------------|
| `code` | Código de la venta |
| `saleDate` | Fecha de la venta |
| `buyer.name` | Nombre del comprador |
| `pigs.length` | Cantidad de cerdos vendidos |
| `totalWeight` | Peso total en kg |
| `totalAmount` | Monto total de la venta |
| `paymentMethod` | `cash` = Efectivo, `transfer` = Transferencia, `check` = Cheque, `credit` = Crédito, `other` = Otro |
| `paymentStatus` | `pending` = Pendiente, `partial` = Parcial, `completed` = Completado |

- Totales al pie: total de ventas, peso total, monto total del periodo

---

## Gastos

### Reporte de Gastos por Rango de Fechas

**Página:** `/expenses/view_expenses`
**Tipo:** PDF por rango de fechas

#### Endpoint
```
GET /reports/expenses/range?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&farm_id={farmId}
```

#### Contenido esperado del PDF
- Encabezado: nombre de la granja, rango de fechas
- Tabla de gastos:

| Campo | Descripción |
|-------|-------------|
| `date` | Fecha del gasto |
| `category` | `LABOR` = Sueldos y nómina, `UTILITY` = Servicios, `MAINTENANCE` = Mantenimiento, `TRANSPORT` = Transporte, `LIVESTOCK_PURCHASE` = Compra de ganado, `VETERINARY` = Veterinario, `OTHER` = Otro |
| `metadata.description` | Descripción del gasto |
| `amount` | Monto del gasto |
| `createdBy.name` + `createdBy.lastname` | Nombre del usuario que registró el gasto |

- Totales al pie: total de registros, gasto total del periodo, gasto promedio

---

## Cerdos

### Reporte de Cerdos Descartados por Rango de Fechas

**Página:** `/pigs/discarded_pigs`
**Tipo:** PDF por rango de fechas

#### Endpoint
```
GET /reports/discarded_pigs/range?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&farm_id={farmId}
```

#### Contenido esperado del PDF
- Encabezado: nombre de la granja, rango de fechas
- Tabla de cerdos descartados en el periodo:

| Campo | Descripción |
|-------|-------------|
| `code` | Código del cerdo |
| `breed` | Raza |
| `birthdate` | Fecha de nacimiento |
| `sex` | `male` = Macho, `female` = Hembra |
| `currentStage` | `piglet` = Lechón, `weaning` = Destete, `fattening` = Engorda, `breeder` = Reproductor |
| `weight` | Peso en kg |
| `status` | `discarded` = Descartado, `dead` = Muerto |

- Totales al pie: total de cerdos descartados en el periodo

---

## Laboratorio

### Reporte de Lotes de Genética Líquida

**Página:** `/laboratory/samples/view_samples`
**Tipo:** PDF directo (sin rango de fechas, todos los lotes)

#### Endpoint
```
GET /reports/semen_samples/all?farm_id={farmId}
```

#### Contenido esperado del PDF
- Encabezado: nombre de la granja, fecha de generación
- Tabla de todos los lotes de semen:

| Campo | Descripción |
|-------|-------------|
| `extraction_id.batch` | Número de lote |
| `extraction_id.boar.code` | Código del verraco |
| `total_doses` | Dosis totales |
| `available_doses` | Dosis disponibles |
| `expiration_date` | Fecha de expiración |
| `conservation_method` | Método de conservación |
| `technician.name` + `technician.lastname` | Responsable |
| `lot_status` | `available` = Disponible, `near_expiration` = A punto de expirar, `expired` = Expirado, `out_of_stock` = Sin dosis, `discarded` = Descartado |

- Resumen al pie: total de lotes, disponibles, próximos a expirar, expirados, descartados

---

## Lactancia

### Reporte de Camadas por Rango de Fechas de Nacimiento

**Página:** `/lactation/view_litters`
**Tipo:** PDF por rango de fechas (filtrado por `birthDate`)

#### Endpoint
```
GET /reports/litters/range?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&farm_id={farmId}
```

#### Contenido esperado del PDF
- Encabezado: nombre de la granja, rango de fechas de nacimiento
- Tabla de camadas nacidas en el periodo:

| Campo | Descripción |
|-------|-------------|
| `code` | Código de la camada |
| `birthDate` | Fecha de nacimiento |
| `mother.code` | Código de la madre |
| `currentMale` | Cantidad de machos actuales |
| `currentFemale` | Cantidad de hembras actuales |
| `averageWeight` | Peso promedio (kg) |
| `totalWeight` | Peso total = `averageWeight * (currentMale + currentFemale)` |
| `status` | `active` = Lactando, `ready_to_wean` = Listo para destetar, `weaned` = Destetada, `wean_overdue` = Destete vencido |

- Totales al pie: total de camadas, total de lechones (machos + hembras)

---

## Grupos

### Reporte de Grupos Destetados por Rango de Fechas de Creación

**Página:** `/groups/view_weaned_groups`
**Tipo:** PDF por rango de fechas (filtrado por `creationDate`)

#### Endpoint
```
GET /reports/groups/weaned/range?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&farm_id={farmId}
```

#### Contenido esperado del PDF
- Encabezado: nombre de la granja, rango de fechas de creación
- Tabla de grupos destetados creados en el periodo:

| Campo | Descripción |
|-------|-------------|
| `code` | Código del grupo |
| `creationDate` | Fecha de creación del grupo |
| `currentMale` | Machos actuales |
| `currentFemale` | Hembras actuales |
| `averageWeight` | Peso promedio (kg) |
| `status` | Estado del grupo (etiqueta legible) |

- Totales al pie: total de grupos, total de cerdos (machos + hembras)

### Reporte de Grupos en Crecimiento por Rango de Fechas de Creación

**Página:** `/groups/view_growing_groups`
**Tipo:** PDF por rango de fechas (filtrado por `creationDate`)

#### Endpoint
```
GET /reports/groups/growing/range?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&farm_id={farmId}
```

#### Contenido esperado del PDF
- Encabezado: nombre de la granja, rango de fechas de creación
- Tabla de grupos en crecimiento (etapa `fattening`) creados en el periodo:

| Campo | Descripción |
|-------|-------------|
| `code` | Código del grupo |
| `name` | Nombre del grupo |
| `area` | Área/corral asignado |
| `creationDate` | Fecha de creación del grupo |
| `currentMale` | Machos actuales |
| `currentFemale` | Hembras actuales |
| `averageWeight` | Peso promedio (kg) |
| `status` | Estado del grupo (etiqueta legible) |

- Totales al pie: total de grupos, total de cerdos (machos + hembras)

---

## Alimentación

### Reporte de Recetas de Alimentación por Rango de Fechas de Creación

**Página:** `/feeding/view_feeding_packages`
**Tipo:** PDF por rango de fechas (filtrado por `creation_date`)

#### Endpoint
```
GET /reports/feeding_packages/range?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&farm_id={farmId}
```

#### Contenido esperado del PDF
- Encabezado: nombre de la granja, rango de fechas de creación
- Tabla de recetas creadas en el periodo:

| Campo | Descripción |
|-------|-------------|
| `code` | Código de la receta |
| `name` | Nombre de la receta |
| `creation_date` | Fecha de creación |
| `creation_responsible.name` + `creation_responsible.lastname` | Responsable de creación |
| `stage` | `general` = General, `piglet` = Lechón, `weaning` = Destete, `fattening` = Engorda, `breeder` = Reproductor |
| `is_active` | `true` = Activo / `false` = Inactivo |

- Totales al pie: total de recetas en el periodo, activas, inactivas

### Reporte de Preparaciones de Alimento por Rango de Fechas

**Página:** `/feeding/view_feed_preparations`
**Tipo:** PDF por rango de fechas (filtrado por `preparationDate`)

#### Endpoint
```
GET /reports/feed_preparations/range?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&farm_id={farmId}
```

#### Contenido esperado del PDF
- Encabezado: nombre de la granja, rango de fechas
- Tabla de preparaciones realizadas en el periodo:

| Campo | Descripción |
|-------|-------------|
| `code` | Código de la preparación |
| `recipe.code` + `recipe.name` | Receta utilizada |
| `preparationDate` | Fecha de preparación |
| `batchSize` | Mezcla preparada (kg) |
| `actualYield` | Producido real (kg) |
| `shrinkagePercentage` | Merma (%) |
| `totalCost` | Costo total ($) |
| `costPerKg` | Costo por kg ($) |
| `responsible.name` + `responsible.lastname` | Responsable |

- Totales al pie: total de preparaciones, total kg producidos, costo total del periodo

---
