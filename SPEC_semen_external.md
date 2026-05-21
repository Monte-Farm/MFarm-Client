# SPEC Backend: Muestra de Semen Externa

## Contexto

El flujo de semen **externo** (`origin: 'external'`) es diferente al interno:

- El usuario **ya compró** el semen: lo registró como orden de compra y le dio entrada al almacén como cualquier producto. Eso ya suma al inventario.
- Al registrar la muestra externa solo se guardan los **datos analíticos** que provee el proveedor y se generan las **dosis** a partir del volumen comprado.
- **No se deben descontar insumos del almacén** (no hay diluyentes).
- **No se debe sumar al inventario** de semen (ya se sumó en la entrada).
- **No se envía `semen_product_id`** ni `lab_supplies`.

---

## Diferencias de payload: interno vs externo

### Interno (`origin: 'internal'`)
```json
{
  "origin": "internal",
  "extraction_id": "<ObjectId de la extracción>",
  "lab_supplies": [ ... ],
  "semen_product_id": "<ObjectId opcional>",
  ...campos analíticos...,
  "doses": [ ... ],
  "total_doses": 14
}
```

### Externo (`origin: 'external'`)
```json
{
  "origin": "external",
  "supplier": {
    "name": "Genética Ibérica S.A.",
    "lot": "EXT-2026-004",
    "purchase_date": "2026-05-20T00:00:00.000Z"
  },
  "semen_volume": 1400,
  "semen_unit": "ml",
  ...campos analíticos...,
  "doses": [ ... ],
  "total_doses": 14
}
```

> `lab_supplies`, `semen_product_id` y `extraction_id` **no se envían** para origen externo.

---

## Lógica de negocio por origen

| Acción | `internal` | `external` |
|--------|-----------|-----------|
| Descontar insumos del almacén | ✅ Sí (por cada item en `lab_supplies`) | ❌ No |
| Sumar semen al inventario | ✅ Sí (a `semen_product_id`, usando volumen total de dosis) | ❌ No (ya se sumó en la entrada de almacén) |
| Registrar salida de almacén | ✅ Sí (`consumption`) | ❌ No |

---

## Cálculo de dosis para origen externo

Las dosis se calculan **solo del volumen de semen comprado** (`semen_volume`). No hay diluyente.

El frontend envía el array `doses[]` ya calculado con:
- `total_volume = semen_volume / número de dosis` (dividido según el `doseSize` elegido)
- `semen_volume = total_volume` (todo es semen, sin diluyente)
- `diluent_volume = 0`

El backend solo debe persistir el array `doses[]` tal como viene.

---

## Validaciones específicas para externo

- `supplier.name`, `supplier.lot`, `supplier.purchase_date` → requeridos
- `semen_volume` > 0 → requerido
- `lab_supplies` → NO requerido, ignorar si viene
- `semen_product_id` → NO requerido, ignorar si viene
- `extraction_id` → NO requerido, ignorar si viene

---

## Campo `semen_volume` en el modelo

Para origen externo conviene persistir el volumen original comprado para trazabilidad:

```
semen_volume: Number   // solo se persiste para origin === 'external'
semen_unit: String     // 'ml' | 'L' | 'cc'
```

---

## Campos nuevos en el modelo `SemenSample` (resumen acumulado)

| Campo | Tipo | Aplica a |
|-------|------|----------|
| `lab_supplies` | Array | `internal` |
| `production_cost` | Number | `internal` (calculado por backend) |
| `semen_product_id` | ObjectId (ref Product) | `internal` (opcional) |
| `semen_volume` | Number | `external` |
| `semen_unit` | String | `external` |
