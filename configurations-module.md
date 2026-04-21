# Configurations Module — Frontend Integration Spec

## Overview

El módulo de configuraciones centraliza los parámetros que controlan el comportamiento del sistema. Está dividido en **dos niveles**:

- **GlobalConfiguration** — un único documento por instancia del sistema. Contiene datos de empresa y preferencias regionales (moneda, locale, timezone, unidades, formato de fecha).
- **FarmConfiguration** — un documento por cada granja (`farmId`). Contiene umbrales biológicos de los ciclos productivos y preferencias de notificaciones de esa granja.

Al arrancar el backend se crean automáticamente:
1. La `GlobalConfiguration` con valores por defecto si no existe.
2. Una `FarmConfiguration` por cada `Farm` existente en la base que aún no tenga una.

Al crear una nueva granja vía `POST /farms`, su `FarmConfiguration` se crea automáticamente con los valores por defecto.

Todas las lecturas están cacheadas en memoria del backend; cada update invalida la entrada correspondiente.

---

## Endpoints

Base path: `/configurations`

Todos los endpoints requieren JWT (header `Authorization: Bearer <token>`).

### `GET /configurations/global`

Devuelve la configuración global única del sistema.

**Response 200**
```json
{
  "status": 200,
  "statusText": "Global configuration retrieved",
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "companyName": "My Company",
    "currency": "MXN",
    "currencySymbol": "$",
    "decimals": 2,
    "locale": "es-MX",
    "timezone": "America/Mexico_City",
    "dateFormat": "DD/MM/YYYY",
    "unitMeasurements": ["kg", "g", "l", "ml", "pz"],
    "createdAt": "2026-04-21T10:00:00.000Z",
    "updatedAt": "2026-04-21T10:00:00.000Z"
  }
}
```

### `PUT /configurations/global`

Actualiza la configuración global (parcial o completa). Todos los campos son opcionales; solo se actualiza lo que se envíe.

**Body (todos opcionales)**
```json
{
  "companyName": "Granja Ejemplo S.A.",
  "currency": "USD",
  "currencySymbol": "US$",
  "decimals": 2,
  "locale": "en-US",
  "timezone": "America/New_York",
  "dateFormat": "MM/DD/YYYY",
  "unitMeasurements": ["kg", "lb", "ton", "pz"]
}
```

**Response 200** — mismo shape que `GET /configurations/global`, con `data` reflejando el estado actualizado.

**Validaciones**
- `decimals`: entero entre 0 y 6.
- `unitMeasurements`: arreglo no vacío.
- Strings: no vacíos.

### `GET /configurations/farm/:farmId`

Devuelve la configuración de una granja específica. Si la granja existe pero no tiene configuración aún, el backend la crea al vuelo con defaults y la devuelve.

**Response 200**
```json
{
  "status": 200,
  "statusText": "Farm configuration retrieved",
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0d2",
    "farmId": "65f0000000000000000000a1",
    "productionCycles": {
      "gestation": {
        "closeToFarrowDays": 107,
        "farrowingPendingDays": 112,
        "overdueFarrowingDays": 117
      },
      "lactation": {
        "weanReadyDays": 21,
        "weanOverdueDays": 28
      },
      "weaning": {
        "fatteningReadyDays": 42,
        "fatteningOverdueDays": 56
      },
      "fattening": {
        "saleReadyDays": 84,
        "saleOverdueDays": 112
      },
      "replacement": {
        "minAge": 140,
        "maxAge": 170
      }
    },
    "notifications": {
      "farrowingAdvanceNotificationDays": 5,
      "stageChangeAdvanceNotificationDays": 3
    },
    "createdAt": "2026-04-21T10:00:00.000Z",
    "updatedAt": "2026-04-21T10:00:00.000Z"
  }
}
```

### `PUT /configurations/farm/:farmId`

Actualiza la configuración de una granja. Se permite enviar `productionCycles`, `notifications` o ambos. Dentro de `productionCycles`, se permite enviar un subconjunto de secciones (`gestation`, `lactation`, `weaning`, `fattening`, `replacement`), pero **si se envía una sección, sus campos son obligatorios** (el DTO no hace deep-merge dentro de cada sección).

**Body (todos opcionales a primer nivel)**
```json
{
  "productionCycles": {
    "gestation": {
      "closeToFarrowDays": 108,
      "farrowingPendingDays": 113,
      "overdueFarrowingDays": 118
    },
    "lactation": {
      "weanReadyDays": 25,
      "weanOverdueDays": 32
    }
  },
  "notifications": {
    "farrowingAdvanceNotificationDays": 7,
    "stageChangeAdvanceNotificationDays": 5
  }
}
```

**Response 200** — mismo shape que `GET /configurations/farm/:farmId`.

**Validaciones**
- Todos los campos numéricos son enteros ≥ 1 (0 en el caso de los de notificación).
- **Coherencia de umbrales** (devuelve `400 Bad Request` si no se cumple):
  - `gestation`: `closeToFarrowDays < farrowingPendingDays < overdueFarrowingDays`
  - `lactation`: `weanReadyDays < weanOverdueDays`
  - `weaning`: `fatteningReadyDays < fatteningOverdueDays`
  - `fattening`: `saleReadyDays < saleOverdueDays`
  - `replacement`: `minAge < maxAge`

---

## Significado y uso de cada campo

### GlobalConfiguration

| Campo | Tipo | Uso en el sistema |
|---|---|---|
| `companyName` | string | Nombre de la empresa (encabezado de reportes PDF). |
| `currency` | string (ISO 4217) | Código de moneda usado en `Intl.NumberFormat` para formatear montos en reportes y pantallas financieras. |
| `currencySymbol` | string | Símbolo corto para mostrar junto a montos cuando no se usa `Intl.NumberFormat` (ej. `$`, `US$`, `R$`). |
| `decimals` | int (0–6) | Decimales a mostrar en montos de moneda. |
| `locale` | string (BCP 47) | Locale para `Intl.NumberFormat` y `toLocaleDateString`. Afecta separadores de miles, decimales, nombres de mes. |
| `timezone` | string (IANA) | Zona horaria usada para interpretar y mostrar fechas. El frontend debería usarla para convertir timestamps UTC recibidos del backend. |
| `dateFormat` | string | Formato preferido para fechas. Valores soportados en reportes: `DD/MM/YYYY`, `MM/DD/YYYY`, `DD/MM/YYYY HH:mm`, `HH:mm`. |
| `unitMeasurements` | string[] | Catálogo de unidades de medida disponibles para productos, alimentos, medicamentos, etc. El frontend las usa para poblar selects. |

### FarmConfiguration

#### `productionCycles.gestation`

Umbrales en **días desde el inicio de la gestación** (inseminación). Usados por el cron diario `PregnancyService.updateFarrowingStatus` para actualizar el `farrowing_status` de cada preñez.

| Campo | Descripción | Efecto |
|---|---|---|
| `closeToFarrowDays` | Días a partir de los cuales el status cambia a `close_to_farrow`. Dispara notificación `BIRTH_APPROACHING`. | Default 107. |
| `farrowingPendingDays` | Días a partir de los cuales el status cambia a `farrowing_pending`. | Default 112. |
| `overdueFarrowingDays` | Día a partir del cual el status cambia a `overdue_farrowing` (parto retrasado). | Default 117. |

#### `productionCycles.lactation`

Umbrales en **días desde el parto (birthDate)**. Usados por el cron diario `LitterService.updateLitterStatus` para actualizar el status de cada lechigada.

| Campo | Descripción | Efecto |
|---|---|---|
| `weanReadyDays` | A partir de este día, la lechigada pasa a `ready_to_wean`. | Default 21. |
| `weanOverdueDays` | A partir de este día, la lechigada pasa a `wean_overdue`. | Default 28. |

#### `productionCycles.weaning` (transición destete → engorda)

Umbrales en **días desde que el grupo entró a la etapa weaning** (`creationDate`). Usados por el cron diario `GroupStatusService.updateGroupStatuses` para grupos cuya `stage === 'weaning'`.

| Campo | Descripción | Efecto |
|---|---|---|
| `fatteningReadyDays` | Antes de este día, `status = 'weaning'`. A partir de este día y hasta `fatteningOverdueDays`, `status = 'ready_to_grow'` (listo para pasar a engorda). | Default 42. |
| `fatteningOverdueDays` | Pasado este día, `status = 'grow_overdue'`. | Default 56. |

#### `productionCycles.fattening` (transición engorda → venta)

Umbrales en **días desde que el grupo entró a la etapa fattening**. Usados por el mismo cron para grupos con `stage === 'fattening'`.

| Campo | Descripción | Efecto |
|---|---|---|
| `saleReadyDays` | Antes de este día, `status = 'growing'`. A partir de este día y hasta `saleOverdueDays`, `status = 'ready_for_sale'`. | Default 84. |
| `saleOverdueDays` | Pasado este día, `status = 'grow_overdue'`. | Default 112. |

#### `productionCycles.replacement`

**Atención**: a diferencia de los demás, estos umbrales son **edad del cerdo desde el nacimiento**, no días en la etapa. Se usan para marcar el flag `isReadyForReplacement` de grupos en engorda cuya edad promedio esté dentro del rango.

| Campo | Descripción |
|---|---|
| `minAge` | Edad mínima (en días desde nacimiento) para ser candidato a selección de reemplazo. Default 140. |
| `maxAge` | Edad máxima. Default 170. |

#### `notifications`

| Campo | Descripción |
|---|---|
| `farrowingAdvanceNotificationDays` | Días de anticipación configurados para avisos visuales de parto en la UI. El backend ya dispara la notificación cuando el status cambia a `close_to_farrow` (según umbrales de gestación); este valor queda disponible por si el frontend necesita banners/indicadores adicionales. |
| `stageChangeAdvanceNotificationDays` | Análogo al anterior pero para cambios de etapa (destete→engorda, engorda→venta). |

---

## Recomendaciones de UI

### Pantalla de configuración global
- Un único formulario con todos los campos de `GlobalConfiguration`.
- Selects para:
  - `currency`: lista ISO 4217 (MXN, USD, COP, BRL, EUR, etc.)
  - `locale`: lista BCP 47 (es-MX, es-ES, en-US, pt-BR, etc.)
  - `timezone`: lista IANA (America/Mexico_City, America/Bogota, America/Sao_Paulo, etc.)
  - `dateFormat`: select con opciones `DD/MM/YYYY`, `MM/DD/YYYY`.
- `unitMeasurements`: input tipo "chips" o multi-select editable.
- Botón "Guardar" → `PUT /configurations/global` con el payload completo.

### Pantalla de configuración por granja
- Si el usuario administra varias granjas, selector de granja arriba. Si solo tiene una, cargarla directo.
- Secciones colapsables: **Ciclos productivos** → subsecciones por etapa; **Notificaciones**.
- Cada campo es un input numérico entero con el valor actual y un helper text explicando qué hace.
- Al guardar, validar en el frontend la coherencia de umbrales (mismas reglas del backend) para dar feedback inmediato. El backend las revalidará.
- Botón "Restaurar valores por defecto": el frontend manda los defaults del spec.

### Cacheo en el frontend
- Cargar `GET /configurations/global` al iniciar sesión y guardarlo en un store global (Pinia/Redux/Zustand/etc.).
- Cargar `GET /configurations/farm/:farmId` cuando el usuario cambia de granja activa.
- Invalidar los stores locales al actualizar exitosamente vía `PUT`.

### Uso de los valores en el resto de la app
- Montos: usar siempre `Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: decimals, maximumFractionDigits: decimals })`.
- Números sin moneda: `Intl.NumberFormat(locale)`.
- Fechas: `new Date(...).toLocaleDateString(locale, ...)` y `toLocaleTimeString(locale, ...)`. Para conversión a la zona horaria, usar librería como `date-fns-tz` o `luxon` con `timezone`.
- Unidades de medida: los selects de unidades deben poblarse desde `globalConfig.unitMeasurements`.

---

## Errores conocidos y respuesta

| Código | Cuándo | Body |
|---|---|---|
| 400 | `farmId` inválido, o umbrales incoherentes | `{ message: "<detalle>", error: "Bad Request", statusCode: 400 }` |
| 404 | Granja inexistente al intentar `PUT` | `{ message: "FarmConfiguration for farm <id> not found", ... }` |
| 500 | Error interno | `{ message: "An unexpected error occurred", ... }` |

---

## Nota sobre multi-tenancy

Actualmente el sistema se despliega una instancia por empresa. La `GlobalConfiguration` es única por instancia. La `FarmConfiguration` permite que dentro de una misma empresa diferentes granjas tengan ciclos productivos distintos (por genética, ubicación, estrategia de manejo).

Si en el futuro se migra a SaaS multi-tenant real, la `GlobalConfiguration` se convertirá en `CompanyConfiguration` con un campo `companyId`. La API cambiará a `/configurations/company/:companyId/global` y `/configurations/company/:companyId/farm/:farmId`, pero la estructura de los campos permanecerá idéntica.
