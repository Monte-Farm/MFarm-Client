# SPEC Frontend: Registro de Muestra de Semen con Insumos de Laboratorio

## Contexto

El formulario de registro de muestra de semen fue actualizado. El campo `diluent` (diluyente único con tipo, lote, volumen y unidad) fue reemplazado por un array dinámico de insumos de laboratorio (`lab_supplies`) que el usuario selecciona desde el catálogo de productos del almacén general de la granja.

Al guardar, el backend automáticamente:
1. Descuenta los insumos del almacén (salida de tipo `consumption`).
2. Agrega las dosis al inventario del producto de semen seleccionado (solo si `origin === 'internal'`).
3. Calcula `total_price` por insumo y el `production_cost` total — **el frontend no debe calcular ni enviar estos valores**.

---

## Cambios en el formulario

### Campos eliminados
- `diluent` (objeto con `type`, `lot`, `volume`, `unit_measurement`) — **ya no existe**.

### Campos nuevos

#### `lab_supplies` (array, requerido)

El usuario selecciona uno o más productos del almacén. Por cada insumo se captura:

| Campo | Tipo | Descripción |
|---|---|---|
| `product_id` | string (ObjectId) | ID del producto en el catálogo |
| `product_name` | string | Nombre del producto (para mostrar, se puede autocompletar) |
| `quantity` | number | Cantidad consumida |
| `unit_measurement` | string | Unidad (se puede autocompletar desde el producto) |
| `unit_price` | number | Precio unitario (se puede autocompletar desde el inventario/promedio del almacén) |

> **Nota:** `total_price` por insumo y `production_cost` total los calcula el backend. No los envíes en el payload.

#### `semen_product_id` (string, opcional)

Solo aplica cuando `origin === 'internal'`. Es el ID del producto en el catálogo de la granja al que se le va a sumar el inventario de las dosis producidas.

- El usuario debe elegirlo explícitamente de un selector (dropdown o búsqueda).
- Filtrar el catálogo por `category === 'laboratory'` para mostrar solo los productos relevantes.
- Si el usuario no tiene ningún producto de categoría `laboratory` creado, mostrar un aviso indicando que debe crear uno primero en el catálogo.
- Si `origin === 'external'`, este campo no se muestra ni se envía.

---

## Cómo obtener los productos disponibles para `lab_supplies`

Usar el endpoint de inventario del almacén principal de la granja. Se recomienda filtrar por `category === 'laboratory'` en cliente (o usar el parámetro `?category=laboratory` si ya está disponible en la API).

```
GET /warehouse/get_inventory/:main_warehouse_id
```

El objeto de cada producto en el inventario incluye el precio promedio calculado. Ese valor se puede precargar como `unit_price` sugerido al seleccionar el producto.

---

## Cómo obtener los productos disponibles para `semen_product_id`

```
GET /products/farm/:farmId
```

Filtrar en cliente por `category === 'laboratory'`. Mostrar nombre y unidad de medida.

---

## Payload completo — `POST /semen_sample/create`

```json
{
  "origin": "internal",
  "farm": "6641abc123...",
  "extraction_id": "6641def456...",
  "technician": "6641ghi789...",
  "concentration_million": 280,
  "motility_percent": 75,
  "vitality_percent": 80,
  "abnormal_percent": 10,
  "pH": 7.2,
  "temperature": 37,
  "conservation_method": "refrigeración",
  "expiration_date": "2026-05-24T00:00:00.000Z",
  "post_dilution_motility": 70,
  "lab_supplies": [
    {
      "product_id": "6641aaa111...",
      "product_name": "Extender BTS",
      "quantity": 150,
      "unit_measurement": "ml",
      "unit_price": 0.85
    },
    {
      "product_id": "6641bbb222...",
      "product_name": "Tubos de recolección",
      "quantity": 20,
      "unit_measurement": "unidad",
      "unit_price": 0.30
    }
  ],
  "semen_product_id": "6641ccc333...",
  "doses": [
    {
      "code": "D-001",
      "semen_volume": 30,
      "diluent_volume": 50,
      "total_volume": 80,
      "unit_measurement": "ml",
      "status": "available"
    }
  ],
  "total_doses": 20,
  "available_doses": 20,
  "lot_status": "available",
  "alert_hours_before_expiration": 12
}
```

---

## Respuestas de error relevantes

### Stock insuficiente — `400 Bad Request`

```json
{
  "statusCode": 400,
  "message": "Insufficient stock for one or more lab supplies",
  "missing": [
    {
      "id": "6641aaa111...",
      "required": 150,
      "available": 80
    }
  ]
}
```

El frontend debe leer el array `missing` e identificar qué producto tiene el problema (por su `id`) para mostrar un mensaje descriptivo al usuario: `"El producto X no tiene suficiente stock. Se requieren 150, hay disponibles 80."`.

---

## Experiencia de usuario sugerida para `lab_supplies`

1. El usuario ve una sección "Insumos de laboratorio" con un botón "+ Agregar insumo".
2. Al presionar, aparece un selector de producto (buscable) que muestra los productos con `category === 'laboratory'` del almacén principal.
3. Al seleccionar un producto, se autocompletan `product_name`, `unit_measurement` y `unit_price` (precio promedio del inventario).
4. El usuario edita la `quantity` y el `unit_price` si es necesario.
5. Se puede agregar múltiples insumos. Se puede eliminar cada uno.
6. Se muestra un resumen del costo total estimado (`sum(quantity * unit_price)`) solo como referencia visual — el valor definitivo lo calcula el backend.

---

## Nuevo valor de categoría de producto: `laboratory`

Al crear o editar un producto en el catálogo, el enum de categorías ahora incluye:

```
"laboratory" → "Laboratorio"
```

Asegúrate de que el selector de categoría en el formulario de productos muestre esta opción.

---

## Compatibilidad con reportes

El reporte de muestra de semen anteriormente mostraba el campo `diluent`. Ahora el objeto `semenSample` en la respuesta del endpoint de reporte contiene:

- `lab_supplies`: array de insumos usados
- `production_cost`: costo total calculado

Actualiza el template del reporte de semen para mostrar la tabla de insumos en lugar del diluyente.
