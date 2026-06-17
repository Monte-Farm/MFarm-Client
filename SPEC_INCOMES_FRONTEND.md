# Incomes Module — Frontend Spec

Base URL: `/incomes`  
Auth: JWT Bearer token requerido en todos los endpoints.

---

## Modelos de datos

### Income (respuesta completa — GET y PUT devuelven esto)

```ts
{
  _id: string                  // MongoDB ObjectId
  id: string                   // Código legible, ej: "IC0001"
  warehouse: Warehouse         // objeto populado
  date: string                 // ISO date
  emissionDate: string         // ISO date
  products: IncomeProduct[]
  totalPrice: number
  discount: number             // porcentaje, ej: 5 = 5%
  tax: number                  // porcentaje, ej: 16 = 16%
  incomeType: string           // ver valores posibles abajo
  origin: {
    originType: string         // nombre de la colección referenciada (ej: "Supplier")
    id: object                 // objeto populado según originType
  } | null
  documents: string[]          // URLs o referencias
  status: boolean
  approvalStatus: 'pending' | 'approved' | 'released'
  purchaseOrder: PurchaseOrder | null   // objeto populado, null para entradas directas
  invoiceNumber?: string
  fiscalRecord?: string
  currency?: string
  cancelled: boolean
}
```

### IncomeProduct

```ts
{
  id: Product        // objeto populado
  quantity: number
  price: number
  totalPrice: number
}
```

### incomeType — valores posibles

| Valor              | Descripción                              | Es interno |
|--------------------|------------------------------------------|------------|
| `purchase`         | Compra directa o con orden de compra     | No         |
| `own_production`   | Producción propia (ej: semen)            | No         |
| `preparation`      | Alimento preparado (feed preparation)    | Sí         |
| `transfer`         | Transferencia entre almacenes            | Sí         |
| `warehouse_order`  | Orden interna de almacén                 | Sí         |

---

## Endpoints

### GET `/incomes`
Devuelve todas las entradas.

**Response:** `Income[]` (populadas)

---

### GET `/incomes/find_incomes_id/:id`
Devuelve un income por su `_id` de MongoDB.

**Response:** `Income` (populada)

---

### GET `/incomes/find_incomes/:field/:value/:multiple`
Búsqueda genérica por campo.

| Param      | Tipo    | Ejemplo                              |
|------------|---------|--------------------------------------|
| `field`    | string  | `"warehouse"`                        |
| `value`    | string  | `"6641..."` (ObjectId como string)   |
| `multiple` | boolean | `true` para array, `false` para uno  |

**Response:** `Income` o `Income[]`

---

### GET `/incomes/find_warehouse_incomes/:warehouse_id`
Devuelve todas las entradas de un almacén específico.

**Response:** `Income[]`

---

### GET `/incomes/income_next_id`
Genera el siguiente código de income (`IC0001`, `IC0002`, …).

**Response:**
```json
{ "data": "IC0005" }
```

---

### GET `/incomes/income_id_exists/:id`
Verifica si un código de income ya existe.

**Response:**
```json
{ "data": true }
```

---

### GET `/incomes/income_statistics/:warehouse_id`
Estadísticas del mes actual para un almacén.

**Response:**
```json
{
  "data": {
    "period": { "month": 6, "year": 2026, "startDate": "...", "endDate": "..." },
    "statistics": {
      "totalValue": 12500.00,
      "totalEntries": 8,
      "averageValuePerEntry": 1562.50
    }
  }
}
```

---

### GET `/incomes/income_charts/:warehouse_id`
Entradas del mes actual agrupadas por tipo.

**Response:**
```json
{
  "data": {
    "period": { "month": 6, "year": 2026, "startDate": "...", "endDate": "..." },
    "entriesByType": { "purchase": 5, "preparation": 3 },
    "valueByType": { "purchase": 9800.00, "preparation": 2700.00 }
  }
}
```

---

### POST `/incomes/create_income`
Crea una nueva entrada.

**Request body:**
```ts
{
  id: string                   // código generado con /income_next_id
  warehouse: string            // ObjectId del almacén
  date: string                 // ISO date
  emissionDate: string         // ISO date
  products: {
    id: string                 // ObjectId del producto
    quantity: number
    price: number
    totalPrice: number
  }[]
  totalPrice: number
  discount: number
  tax: number
  incomeType: string
  origin: {
    originType: string
    id: string                 // ObjectId del origen
  } | null
  documents: string[]
  status: boolean              // siempre true al crear
  purchaseOrder?: string       // ObjectId, omitir o null para entradas directas
  invoiceNumber?: string
  fiscalRecord?: string
  currency?: string
}
```

**Response:** `Income` (documento Mongoose, no populado — el front debe re-fetch con `find_incomes_id` si necesita datos populados)

---

### PUT `/incomes/update_income/:id`

Edita una entrada existente. Solo se permite si `approvalStatus` es `pending` o `released` (las `approved` no se pueden editar).

> **Cambio reciente:** Antes el endpoint devolvía un DTO plano con ObjectIds crudos. Ahora devuelve el documento **completamente populado** igual que `find_incomes_id`. Esto resuelve el problema donde las entradas directas (sin orden de compra) no mostraban datos correctamente en el front.

**URL param:** `id` = MongoDB `_id` del income

**Request body:** mismo shape que `create_income`

**Comportamiento del inventario:**
- Revierte el stock de los productos anteriores en el almacén viejo
- Si el almacén cambió, mueve la referencia del income al almacén nuevo
- Aplica el nuevo stock con los productos nuevos en el almacén nuevo
- Si `approvalStatus` era `released`, lo regresa a `pending` automáticamente

**Errores posibles:**

| Status | Cuándo                                                                 |
|--------|------------------------------------------------------------------------|
| 403    | El income está en `approved` — hay que liberarlo (`release`) primero   |
| 400    | Parte del stock ya salió del almacén — no se puede revertir            |
| 404    | Income no encontrado                                                   |

**Response:** `Income` (completamente populada, mismo shape que `find_incomes_id`)

---

### PATCH `/incomes/approve/:id`
Aprueba un income `pending`. Solo roles `farm_manager` y `finance_manager`.

**Response:** `Income` (sin popular)

---

### PATCH `/incomes/release/:id`
Libera un income `approved`. Solo roles `farm_manager` y `finance_manager`.  
Un income `released` puede volver a editarse (el PUT lo regresa a `pending`).

**Response:** `Income` (sin popular)

---

### PATCH `/incomes/cancel/:id`
Cancela un income. Solo aplica a incomes en estado `pending`.  
Revierte el stock del almacén. No se puede deshacer.

**Errores posibles:**

| Status | Cuándo                                                           |
|--------|------------------------------------------------------------------|
| 400    | Ya está cancelado                                                |
| 400    | No está en `pending`                                             |
| 400    | Parte del stock ya salió — no se puede revertir                  |

**Response:** `Income` (sin popular)

---

### DELETE `/incomes/delete_income/:id`
Soft delete — pone `status: false`. No puede eliminarse un income `approved`.

**Response:** Income con `status: false`

---

## Notas para el front

### Flujo de aprobación
```
pending → (approve) → approved → (release) → released
released → (edit con PUT) → pending   ← vuelve al inicio
pending → (cancel) → cancelled        ← irreversible
```

### Entradas directas vs con orden de compra
- Entradas directas: `purchaseOrder` es `null`, `origin` apunta a un `Supplier`
- Con orden de compra: `purchaseOrder` es un objeto `PurchaseOrder` populado, `origin` puede apuntar a la misma orden

### Respuestas del PUT (cambio importante)
Antes del fix, el `PUT /update_income/:id` devolvía un DTO plano con ObjectIds sin popular. Ahora devuelve el mismo shape que `GET /find_incomes_id/:id` — con `warehouse`, `products[].id`, `origin.id` y `purchaseOrder` completamente populados. El front puede usar esta respuesta directamente para actualizar el estado local sin necesidad de hacer un re-fetch.
