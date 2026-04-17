# Notifications Module

Módulo de notificaciones en tiempo real. Combina persistencia en MongoDB con emisión vía WebSocket (Socket.IO), para que el frontend pueda mostrar notificaciones al instante y también consultarlas históricamente.

---

## Arquitectura general

```
Sistema (cron / evento)
        │
        ▼
NotificationService.createMany()
        │
        ├── Guarda en MongoDB (una por usuario)
        │
        └── Emite socket al room del usuario → cliente recibe "notification:new"
```

---

## WebSocket

### Conexión

- **Namespace:** `/notifications`
- **URL completa:** `ws://<host>/notifications`

El cliente debe conectarse enviando el JWT en el handshake:

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/notifications', {
  auth: { token: '<jwt_access_token>' },
});
```

También se acepta el token via header `Authorization: Bearer <token>`.

El gateway extrae el `userId` y `farmId` del JWT y une al socket a dos rooms:
- `<userId>` — notificaciones personales
- `farm:<farmId>` — broadcasts de la granja

Si el token es inválido o no se provee, la conexión es rechazada automáticamente.

---

### Evento entrante: `notification:new`

Evento que el servidor emite cuando se crea una notificación dirigida al usuario conectado.

```ts
socket.on('notification:new', (notification) => {
  console.log(notification);
});
```

**Payload:**

```json
{
  "id": "664f1a2b3c4d5e6f7a8b9c0d",
  "type": "health_alert",
  "title": "Cerdo muerto",
  "message": "El cerdo PG-00123 fue registrado como muerto.",
  "read": false,
  "entity": {
    "type": "pig",
    "id": "664a1b2c3d4e5f6a7b8c9d0e",
    "code": "PG-00123"
  },
  "createdAt": "2026-04-17T14:30:00.000Z"
}
```

El campo `entity` es **opcional** y señala a qué registro del sistema se refiere la notificación. Úsalo en el frontend para redirigir al detalle correspondiente cuando el usuario hace click.

### Tipos de `entity.type`

| Valor | Qué representa |
|-------|----------------|
| `birth` | Parto |
| `pregnancy` | Preñez (incluye abortos) |
| `insemination` | Inseminación (diagnóstico) |
| `pig` | Cerdo individual |
| `group` | Grupo |
| `income` | Ingreso al almacén |

### Mapeo a rutas del frontend (ejemplo)

El backend no conoce las rutas del frontend — tú decides a dónde navegar:

```js
const routes = {
  birth: (id) => `/partos/${id}`,
  pregnancy: (id) => `/prenez/${id}`,
  insemination: (id) => `/inseminaciones/${id}`,
  pig: (id) => `/cerdas/${id}`,
  group: (id) => `/grupos/${id}`,
  income: (id) => `/almacen/ingresos/${id}`,
};

function onNotificationClick(notification) {
  if (notification.entity) {
    navigate(routes[notification.entity.type](notification.entity.id));
  }
  markAsRead(notification.id);
}
```

---

## REST API

Base path: `/notifications`  
Todos los endpoints requieren `Authorization: Bearer <token>`.

---

### `POST /notifications/create`
> **Uso interno del sistema.** No debe llamarse desde el frontend directamente.

Crea una notificación para un usuario específico y la emite por WebSocket.

**Body:**
```json
{
  "targetUserId": "664f1a2b3c4d5e6f7a8b9c0d",
  "type": "stage_change",
  "title": "Cambio de etapa",
  "message": "El grupo G-0012 pasó a engorda."
}
```

---

### `POST /notifications/create_many`
> **Uso interno del sistema.**

Crea una notificación para múltiples usuarios. Genera un documento por usuario y emite a cada room.

**Body:**
```json
{
  "targetUserIds": ["664f...", "664g..."],
  "type": "birth_approaching",
  "title": "Parto próximo",
  "message": "La cerda PG-00045 tiene parto estimado en 3 días."
}
```

---

### `POST /notifications/create_for_farm`
> **Uso interno del sistema.**

Emite un broadcast a todos los usuarios de la granja que estén **conectados en ese momento** vía WebSocket. **No persiste en MongoDB.**

**Body:**
```json
{
  "farmId": "664f1a2b3c4d5e6f7a8b9c0d",
  "type": "system",
  "title": "Alerta de granja",
  "message": "Se detectó un problema general en la granja."
}
```

---

### `GET /notifications/find_by_user`

Retorna todas las notificaciones del usuario autenticado, ordenadas de más reciente a más antigua.

**Response:**
```json
{
  "statusCode": 200,
  "message": "Notifications found",
  "data": [
    {
      "_id": "664f1a2b3c4d5e6f7a8b9c0d",
      "userId": "...",
      "type": "health_alert",
      "title": "Enfermedad registrada",
      "message": "Se registró una enfermedad en el cerdo PG-00088.",
      "read": false,
      "createdAt": "2026-04-17T10:00:00.000Z",
      "updatedAt": "2026-04-17T10:00:00.000Z"
    }
  ]
}
```

---

### `GET /notifications/unread_count`

Retorna el número de notificaciones no leídas del usuario autenticado. Útil para mostrar el badge del ícono de notificaciones.

**Response:**
```json
{
  "statusCode": 200,
  "message": "Unread notifications",
  "data": 4
}
```

---

### `PUT /notifications/mark_as_read/:notification_id`

Marca una notificación específica como leída. Solo funciona si la notificación pertenece al usuario autenticado.

**Response:** el documento actualizado.

**Error 404** si no se encuentra o ya estaba leída.

---

### `PUT /notifications/mark_all_as_read`

Marca todas las notificaciones no leídas del usuario autenticado como leídas.

**Response:**
```json
{
  "statusCode": 200,
  "message": "All marked as read",
  "data": {
    "matchedCount": 5,
    "modifiedCount": 5
  }
}
```

---

## Tipos de notificación (`type`)

| Valor | Cuándo se usa |
|-------|--------------|
| `birth_approaching` | Parto próximo (cron diario) |
| `stage_change` | Grupo cambia de etapa o está listo para cambiar |
| `weight_goal` | Cerdo alcanza peso objetivo *(reservado para implementación futura)* |
| `feeding_alert` | Alerta de alimentación *(reservado)* |
| `health_alert` | Aborto, cerdo muerto/descartado, enfermedad, evento de salud en grupo |
| `system` | Preñez registrada, grupo desactivado, nueva compra en almacén |

---

## Eventos que generan notificaciones automáticas

El sistema genera notificaciones automáticamente ante los siguientes eventos. El frontend no necesita hacer nada especial — simplemente escuchar el socket.

| Evento | Módulo | Tipo | Destinatarios |
|--------|--------|------|---------------|
| Nueva preñez registrada | Pregnancies | `system` | Gerente, Veterinario |
| Diagnóstico negativo de inseminación (`empty`/`resorption`/`abortion`) | Inseminations | `health_alert` | Gerente, Veterinario |
| Aborto registrado | Pregnancies | `health_alert` | Gerente, Veterinario |
| Abortos en masa | Pregnancies | `health_alert` | Gerente, Veterinario |
| Parto próximo (cron medianoche) | Pregnancies | `birth_approaching` | Gerente, Veterinario |
| Parto registrado | Births | `birth_approaching` | Gerente, Veterinario |
| Cerdo muerto o descartado | Pigs | `health_alert` | Gerente, Veterinario |
| Enfermedad registrada en cerdo | Pigs | `health_alert` | Gerente, Veterinario |
| Grupo cambia de etapa | Groups | `stage_change` | Gerente |
| Evento de salud en grupo | Groups | `health_alert` | Gerente, Veterinario |
| Grupo desactivado | Groups | `system` | Gerente |
| Grupo listo para cambio/venta (cron) | Groups | `stage_change` | Gerente, Veterinario |
| Nueva compra en almacén | Incomes | `system` | Gerente |

---

## Flujo recomendado de implementación en el frontend

### 1. Al hacer login

```js
// Guardar el token y establecer conexión WebSocket
const socket = io('http://localhost:3000/notifications', {
  auth: { token: accessToken },
});

socket.on('connect', () => {
  console.log('Conectado a notificaciones');
  fetchUnreadCount(); // cargar badge inicial
});

socket.on('disconnect', () => {
  console.log('Desconectado');
});
```

### 2. Escuchar notificaciones nuevas

```js
socket.on('notification:new', (notification) => {
  // Agregar al estado local
  addNotification(notification);

  // Incrementar badge
  incrementUnreadCount();

  // Opcional: mostrar toast/snackbar
  showToast(notification.title, notification.message);
});
```

### 3. Panel de notificaciones (al abrir)

```js
// GET /notifications/find_by_user
const notifications = await fetchNotifications();

// GET /notifications/unread_count
const count = await fetchUnreadCount();
```

### 4. Marcar como leída

```js
// Al hacer click en una notificación
// PUT /notifications/mark_as_read/:id
await markAsRead(notification._id);
decrementUnreadCount();
```

### 5. Marcar todas como leídas

```js
// Botón "Marcar todas como leídas"
// PUT /notifications/mark_all_as_read
await markAllAsRead();
resetUnreadCount();
```

### 6. Al hacer logout

```js
socket.disconnect();
```

---

## Notas

- Las notificaciones de `create_for_farm` **no se persisten** en la base de datos — solo llegan a usuarios conectados en ese momento.
- Las notificaciones de `create` y `create_many` **sí se persisten** y pueden consultarse con `find_by_user` aunque el usuario no estuviera conectado al momento del evento.
- El campo `read` siempre inicia en `false` y solo puede pasar a `true` mediante los endpoints de mark.
- No existe endpoint de eliminación — las notificaciones son permanentes.
