# AI Report Generation — Especificación para el front

La IA ahora puede generar cualquiera de los ~20 reportes PDF del sistema,
subirlos a Firebase Storage y devolver un **signed URL de descarga**
(válido por 24h). Tu trabajo en el front: detectar que un turno incluyó
un reporte y renderizar un botón "Descargar" que apunte a ese URL.

---

## Cómo se entrega al cliente

El backend **extiende** el contrato con un campo `report` y, en el modo
streaming, emite un nuevo evento `report_ready`.

### `POST /ai/chat` (no-stream)

La respuesta ahora incluye `report`:

```json
{
  "reply": "El reporte de mortalidad está listo para descargar.",
  "conversationId": "65f2c8b3e4a1c2d3f4a5b6c7",
  "toolsUsed": [...],
  "complexity": "medium",
  "model": "claude-sonnet-4-6",
  "chart": null,
  "report": {
    "section": "mortality",
    "format": "pdf",
    "filename": "reporte_mortality_2026-01-01_a_2026-03-31.pdf",
    "reportUrl": "https://storage.googleapis.com/...signed...",
    "bytes": 234567,
    "expiresAt": "2026-04-22T19:50:39.613Z"
  }
}
```

Si la IA no generó reporte, `report` es `null`.

### `POST /ai/chat/stream`

Nuevo evento **`report_ready`** que se emite en cuanto la tool termina,
antes del texto final:

```
start → iteration → tool_use(generateReport) → tool_result → report_ready → text_delta* → done
```

Formato:

```json
{
  "type": "report_ready",
  "report": {
    "section": "mortality",
    "format": "pdf",
    "filename": "reporte_mortality_2026-01-01_a_2026-03-31.pdf",
    "reportUrl": "https://storage.googleapis.com/...",
    "bytes": 234567,
    "expiresAt": "2026-04-22T19:50:39.613Z"
  }
}
```

El evento `done` también incluye `report` al final (mismo objeto) —
úsalo como fallback si no capturaste `report_ready`.

---

## Tipos TypeScript

```ts
export interface AiReport {
  section: string;
  format: 'pdf';
  filename: string;
  reportUrl: string;       // signed URL, expira en 24h
  bytes: number;
  expiresAt: string;       // ISO date
}

export interface ChatResponse {
  reply: string;
  conversationId: string;
  toolsUsed: { name: string; input: any }[];
  complexity: 'simple' | 'medium' | 'complex';
  model: string;
  chart?: ChartSpec | null;
  report?: AiReport | null;
}
```

---

## Catálogo completo de reportes

La IA conoce estos `section` values y los elige automáticamente según lo
que pida el usuario. No tienes que exponer esto en la UI — es
informativo.

### Producción
| Section | Descripción | Params extra |
|---|---|---|
| `inseminations-births` | Inseminaciones y nacimientos | `startDate`, `endDate` |
| `groups` | Reporte de grupos (movimientos, etapas) | `startDate`, `endDate` |
| `mortality` | Mortalidad (por etapa/grupo/causa) | `startDate`, `endDate` |
| `feed-weight` | Consumo de alimento y ganancia de peso | `startDate`, `endDate` |
| `reproductive` | Reproductivo completo | `startDate`, `endDate` |

### Ventas
| Section | Descripción | Params extra |
|---|---|---|
| `sales-overview` | Resumen de ventas | `startDate`, `endDate` |
| `clients` | Reporte por cliente | `startDate`, `endDate` |

### Finanzas
| Section | Descripción | Params extra |
|---|---|---|
| `purchases` | Compras del periodo | `startDate`, `endDate` |
| `costs` | Costos detallados | `startDate`, `endDate` |
| `profitability` | Rentabilidad | `startDate`, `endDate` |
| `operations-closing` | Cierre de operaciones | `startDate`, `endDate` |
| `cash-flow` | Flujo de caja | `startDate`, `endDate` |
| `supplier-statement` | Estado de cuenta de un proveedor | `supplierId`, `startDate`, `endDate` |
| `manual-expenses` | Gastos manuales | `startDate`, `endDate` |

### Inventario
| Section | Descripción | Params extra |
|---|---|---|
| `movements` | Movimientos de almacén | `startDate`, `endDate` |
| `feed-consumption` | Consumo de alimento | `startDate`, `endDate` |
| `alerts` | Alertas de inventario | `startDate`, `endDate` |
| `valuation` | Valorización de inventario | `startDate`, `endDate` |

### Otros
| Section | Descripción | Params extra |
|---|---|---|
| `catalogs` | Catálogos maestros (sin rango de fechas) | — |
| `group-traceability` | Trazabilidad completa de un grupo | `groupId` |
| `audit` | Auditoría (cambios del usuario) | `startDate`, `endDate` |

---

## Implementación sugerida en el front

Componente simple que se renderiza cuando el mensaje de la IA trae un
reporte:

```tsx
import type { AiReport } from '@/types/ai';

export function ReportCard({ report }: { report: AiReport }) {
  const sizeMb = (report.bytes / (1024 * 1024)).toFixed(2);
  const expires = new Date(report.expiresAt).toLocaleString();

  return (
    <div className="flex items-center gap-3 rounded border bg-white p-3">
      <div className="flex-1">
        <div className="text-sm font-medium">{report.filename}</div>
        <div className="text-xs text-gray-500">
          PDF · {sizeMb} MB · expira {expires}
        </div>
      </div>
      <a
        href={report.reportUrl}
        target="_blank"
        rel="noopener noreferrer"
        download={report.filename}
        className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        Descargar
      </a>
    </div>
  );
}
```

Dentro del chat bubble:

```tsx
{message.chart && <AiChart spec={message.chart} />}
{message.report && <ReportCard report={message.report} />}
<p className="mt-2 text-sm">{message.reply}</p>
```

### Integración con el stream

```ts
case 'report_ready':
  state.report = e.report;
  break;
case 'done':
  state.status = 'done';
  if (!state.report && e.report) state.report = e.report;
  break;
```

---

## Ejemplos de preguntas que disparan un reporte

- "Dame el reporte de mortalidad del primer trimestre en PDF."
- "Exporta las ventas de marzo."
- "Quiero descargar el estado de cuenta del proveedor Agropecuaria X del año pasado." → requiere que la IA resuelva `supplierId` antes con otra tool (todavía no existe `queryCounterparties` — lo haré en el siguiente paso).
- "Genera la trazabilidad del grupo G-0010." → la IA resuelve `groupId` con `queryGroups` primero.
- "Dame el cierre de operaciones de 2025."
- "Exporta el flujo de caja de los últimos 6 meses."

---

## Seguridad

- Los archivos se guardan en `ai-reports/<farmId>/<userId>/<uuid>-<filename>.pdf`.
- El URL devuelto es un **signed URL v4** — solo funciona con la firma
  y expira en 24h.
- Fuera de esa ventana, el link deja de ser válido (aunque el archivo
  siga en el bucket). Recomendado: configurar una **lifecycle rule** en
  el bucket de GCS que borre objetos bajo `ai-reports/` con edad > 7
  días.

---

## Resumen del trabajo en el front

1. Agregar el tipo `AiReport` a tus tipos.
2. Extender `ChatResponse` con el campo opcional `report`.
3. Agregar el case `report_ready` al handler del stream.
4. Implementar `<ReportCard report={...} />` (componente arriba).
5. Renderizarlo en el chat cuando `message.report` existe.
6. (Opcional) Guardar `report` en local storage con el mensaje para
   re-renderizar al recargar. El URL expira en 24h; si el usuario vuelve
   después, el link deja de funcionar — muestra un mensaje tipo "Enlace
   expirado" o oculta el botón comparando `expiresAt` con ahora.
