# Backend spec — Feed Preparation rework

**Contexto:** Cambiamos el flujo del módulo de Alimentación. Antes el usuario tenía que crear primero la receta (`FeedingPackage`) con porcentajes calculados manualmente, y solo entonces podía preparar alimento. El feedback del cliente fue: *"si tengo que calcular la proporción por fuera, el sistema no me está ayudando"*. Ahora el flujo principal es al revés:

1. El usuario va directo a **Preparar alimento**, agrega ingredientes con **cantidades absolutas en kg** (ej. 560 kg maíz, 10 kg sal, 50 kg grasa) y el sistema le muestra las proporciones automáticamente.
2. Opcionalmente, al guardar la preparación, puede **guardar esa mezcla como receta** para reutilizarla.
3. Si parte de una receta existente, puede **modificarla en el momento** (cambiar el 25% de grasa a 30%, por ejemplo) y elegir si actualiza la receta original, la guarda como receta nueva, o solo aplica los cambios a esta preparación.

La receta sigue siendo un recurso útil (catálogo de mezclas guardadas), pero **ya no es un requisito previo** para una preparación.

Este documento describe los cambios necesarios en el backend. El frontend ya está implementado en `src/Components/Common/Forms/FeedPreparationForm.tsx`.

---

## 1. Cambios en el modelo `FeedPreparation`

La preparación ahora puede existir sin receta, y siempre lleva su propia lista de ingredientes finales (no inferida de la receta). Las preparaciones históricas no se ven afectadas si actualizamos la receta original (snapshot al momento de preparar).

```ts
FeedPreparation {
  _id
  code                        // string, autogenerado
  farm                        // ObjectId, requerido
  recipe?                     // ObjectId — AHORA OPCIONAL (puede ser null si la mezcla fue ad-hoc)
  recipeSnapshot?: {          // NUEVO — snapshot opcional de la receta al momento de preparar
    code, name, stage, expectedYield
  }
  preparationDate             // Date, requerido
  batchSize                   // number — suma de kg de ingredientes (calculado por backend, no confiar en input)
  actualYield                 // number — lo que realmente salió del mezclador
  shrinkage                   // number — batchSize - actualYield
  shrinkagePercentage         // number — (shrinkage / batchSize) * 100
  subwarehouse                // ObjectId, requerido (de dónde se descuenta inventario)
  ingredientsUsed: [{         // NUEVO formato — lista propia, no derivada de la receta
    product                   // ObjectId
    quantity                  // number (kg usados)
    percentage                // number (% de la mezcla, calculado backend)
    unitPrice                 // number (precio promedio al momento de preparar)
    subtotal                  // number (quantity * unitPrice)
  }]
  totalCost                   // number — suma de subtotales
  costPerKg                   // number — totalCost / actualYield
  preparedProduct?            // ObjectId — producto generado (igual que hoy, si aplica)
  responsible                 // ObjectId user
  notes?                      // string
  createdAt, updatedAt
}
```

**Migración:** las preparaciones existentes ya tienen `ingredientsUsed` (con product/quantity/unitPrice/subtotal) y `recipe`. Solo hay que:
- Agregar `percentage` calculado a las filas existentes (a partir de `quantity / batchSize * 100`).
- Permitir `recipe = null` a futuro (no tocar existentes).

---

## 2. Endpoint a modificar: `POST /feed_preparation/create`

**Es el cambio principal.** El payload ya no se basa en una receta + batchSize; ahora recibe la lista de ingredientes explícita y, opcionalmente, instrucciones para crear/actualizar una receta.

### Request body

```json
{
  "farmId": "67abc...",
  "subwarehouseId": "67def...",
  "date": "2026-05-13T00:00:00.000Z",
  "responsibleId": "67ghi...",
  "notes": "Mezcla de prueba",

  "batchSize": 620.00,                // suma de kg de ingredients (backend debe recalcular y validar)
  "actualYield": 615.50,              // kg producidos realmente

  "ingredients": [                    // NUEVA forma
    { "productId": "67p1...", "quantity": 465.00, "percentage": 75.00 },
    { "productId": "67p2...", "quantity": 155.00, "percentage": 25.00 }
  ],

  "recipeId": "67rec..." | null,      // OPCIONAL — receta de origen (informativo / para snapshot)

  "recipeSaveMode": "none" | "new" | "update",

  "newRecipe": {                      // requerido SOLO si recipeSaveMode === "new"
    "code": "REC-042",
    "name": "Mezcla engorde personalizada",
    "stage": "fattening"              // enum: general|piglet|weaning|fattening|breeder
  }
}
```

### Validaciones (backend)

1. `ingredients.length >= 1`, todas con `quantity > 0`.
2. Recalcular `batchSize = sum(ingredients[i].quantity)` y recalcular `percentage` de cada ingrediente (no confiar en lo que mandó el cliente — el cliente lo manda solo para mostrar mismo número, pero la verdad la tiene el backend).
3. `actualYield > 0 && actualYield <= batchSize`.
4. Cada `productId` debe existir, pertenecer al farm, ser tipo `raw` y de categoría `nutrition | vitamins | minerals`.
5. **Stock check:** para cada ingrediente, validar que el `subwarehouse` tenga >= `quantity`. Si falta, responder igual que hoy:
   ```json
   400 { "missing": [{ "productId", "product", "required", "available" }, ...] }
   ```
6. Si `recipeSaveMode === "new"`:
    - `newRecipe.code` debe ser único (chequear contra `feeding_package.code`).
    - `newRecipe.name`, `newRecipe.stage` requeridos.
7. Si `recipeSaveMode === "update"`:
    - `recipeId` requerido.
    - Receta debe existir y pertenecer al farm.
    - Solo se actualizan los `feedings` (lista ingredientes + porcentajes); el resto (nombre, código, etapa, etc.) NO se toca.

### Lógica

```
BEGIN TRANSACTION
  1. Calcular precios promedio de cada productId en ese farm (lógica actual de /warehouse/average_prices).
  2. Construir ingredientsUsed[] con quantity, percentage (recalculado), unitPrice, subtotal.
  3. Calcular totalCost = sum(subtotal), costPerKg = totalCost / actualYield.
  4. Descontar quantity de cada producto del subwarehouse (lógica actual de movimientos de inventario).
  5. Si hay preparedProduct generado (lógica actual), incrementar su stock en actualYield kg.
  6. Crear FeedPreparation con recipe = recipeId || null, recipeSnapshot si recipeId presente.
  7. Si recipeSaveMode === "new":
       crear FeedingPackage {
         code: newRecipe.code,
         name: newRecipe.name,
         stage: newRecipe.stage,
         farm, creation_responsible: responsibleId,
         creation_date: now, is_active: true,
         expectedYield: (actualYield / batchSize) * 100,    // rendimiento observado
         feedings: ingredients.map(i => ({ feeding: i.productId, percentage: recalculated }))
       }
       y guardar su _id en preparation.recipe (para que quede vinculada).
  8. Si recipeSaveMode === "update":
       actualizar feedingPackage.feedings con los nuevos ingredients + porcentajes recalculados.
       (no tocar code/name/stage/expectedYield — el usuario lo cambia explícitamente desde la pantalla de recetas).
COMMIT
```

### Response

```json
201 {
  "data": {
    "_id": "...",
    "code": "PREP-0034",
    ...campos completos de la preparación creada...,
    "recipe": { "_id": "...", "code": "...", "name": "...", "stage": "..." } | null,
    "createdRecipe": { ... } | null   // solo si recipeSaveMode === "new"
  }
}
```

---

## 3. Endpoint a mantener / asegurar: `POST /warehouse/average_prices/:farmId`

Ya existe (lo usamos hoy para el preview de costo). El form lo llama desde el frontend cuando el usuario:
- Selecciona una receta (precarga precios de sus ingredientes).
- Agrega nuevos ingredientes a la mezcla.

**Request:** `{ "productIds": ["67...", "67..."] }`
**Response:** `{ "data": [{ "productId", "averagePrice" }, ...] }`

Confirmar que sigue funcionando igual.

---

## 4. Endpoint a verificar: `GET /warehouse/feeding_products/:farmId`

Ya existe. El frontend lo llama y filtra en cliente por `type === 'raw'` y `category ∈ {nutrition, vitamins, minerals}`. **Lo ideal sería que el backend ya devuelva solo esos** para no enviar productos irrelevantes, pero no es bloqueante. Si está bien, déjalo.

---

## 5. Endpoint que probablemente sigue igual: `GET /feeding_package/find_by_farm/:farmId`

El form llama este endpoint para llenar el dropdown de "Receta base (opcional)". No requiere cambios. Solo confirmar que sigue devolviendo `is_active`, `feedings: [{ feeding: ObjectId | populated, percentage }]`.

Idealmente, en la respuesta los `feeding` vienen **populated** con `{_id, name, code, category, unit_measurement}` para que el frontend no tenga que hacer otra llamada. Hoy ya parece funcionar así.

---

## 6. Cambios indirectos en otros endpoints

### `GET /feed_preparation/find_by_id/:id` y `find_by_farm/:farmId`

Asegurar que devuelven el nuevo campo `ingredientsUsed[i].percentage`. Hoy probablemente ya devuelven el resto, solo añadir `percentage` al populate/projection.

### `GET /feed_preparation/find_by_recipe/:recipeId`

Si `recipe` ahora puede ser `null`, este endpoint sigue válido (solo devuelve las que sí tienen recipe). Sin cambios.

### Vista de detalle de la preparación

El componente `FeedPreparationDetails` ya muestra ingredientes — solo necesita que el campo `percentage` venga incluido. No requiere endpoint nuevo.

---

## 7. Compatibilidad con `FeedingPackageForm` actual

El form de recetas (`FeedingPackageForm.tsx`) sigue funcionando como hasta ahora — el usuario puede crear/editar recetas directamente desde la pantalla de Recetas. **No requiere cambios en backend**.

Los endpoints que usa (`feeding_package/create`, `update`, `next_feeding_code`, `check_code_exists`, `find_by_id`) se quedan igual.

---

## 8. Resumen de cambios solicitados (TL;DR)

| Endpoint | Cambio |
|---|---|
| `POST /feed_preparation/create` | **Reescribir.** Nuevo payload (ver §2). Acepta ingredientes ad-hoc, recipe opcional, y opcionalmente crea/actualiza receta. Transaccional. |
| Modelo `FeedPreparation` | Hacer `recipe` opcional, agregar `recipeSnapshot`, agregar `percentage` a cada item de `ingredientsUsed`. Migración descrita en §1. |
| `GET /feed_preparation/find_by_*` | Incluir `percentage` en `ingredientsUsed`. |
| `POST /warehouse/average_prices/:farmId` | Sin cambios. Solo confirmar que sigue vivo. |
| `GET /warehouse/feeding_products/:farmId` | Sin cambios obligatorios. |
| `GET /feeding_package/find_by_farm/:farmId` | Sin cambios. |
| Modelo `FeedingPackage` | Sin cambios. |

---

## 9. Casos de prueba sugeridos

1. **Preparación sin receta**, 3 ingredientes (500 kg maíz, 10 kg sal, 90 kg grasa), `recipeSaveMode: "none"`.
   - ✅ Se crea la preparación con `recipe: null`.
   - ✅ `batchSize = 600`, porcentajes recalculados: 83.33%, 1.67%, 15%.
   - ✅ Inventario descontado del subwarehouse.

2. **Preparación sin receta, guardar como nueva.**
   - ✅ Crea preparación + crea `FeedingPackage` nuevo con esos ingredientes/porcentajes.
   - ✅ `preparation.recipe` apunta a la receta recién creada.

3. **Preparación con receta existente, modificar % de un ingrediente, `recipeSaveMode: "update"`.**
   - ✅ Actualiza `feedingPackage.feedings`.
   - ✅ Preparaciones anteriores que apuntaban a esa receta NO cambian (porque guardan su propio `ingredientsUsed`).

4. **Preparación con receta existente, `recipeSaveMode: "none"`** y porcentajes modificados.
   - ✅ Receta NO se altera.
   - ✅ La preparación queda con los porcentajes nuevos (los de la receta original quedan ignorados).

5. **Falta stock.** Responde 400 con array `missing` (mismo contrato actual).

6. **Código de receta duplicado** cuando `recipeSaveMode: "new"`. Responde 400 / 409 con mensaje claro.

7. **`actualYield > batchSize`.** Responde 400.
