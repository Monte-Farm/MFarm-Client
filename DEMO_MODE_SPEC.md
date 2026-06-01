# Especificación: Modo Demo

## Frontend — Variable de entorno

En el archivo `.env` del cliente (rama `demo`):

```
REACT_APP_DEMO_MODE=true
```

> Con `false` (o sin la variable) la app funciona normalmente con el login estándar.  
> Con `true` el login se reemplaza por un selector de roles y aparece el badge **DEMO** en el header.

---

## Backend — Lo que se necesita

### 1. Endpoint de demo-login

```
POST /user/demo-login
```

**Body:**
```json
{ "role": "farm_manager" }
```

**Roles válidos:**
- `Superadmin`
- `farm_manager`
- `warehouse_manager`
- `subwarehouse_manager`
- `general_worker`
- `reproduction_technician`
- `veterinarian`
- `finance_manager`

**Respuesta esperada — mismo shape que `/user/login`:**
```json
{
  "data": {
    "_id": "...",
    "username": "demo_farm_manager",
    "name": "Demo",
    "lastname": "Farm Manager",
    "email": "demo@mfarm.com",
    "role": ["farm_manager"],
    "farm_assigned": "<id de la granja demo>",
    "status": true,
    "token": "<JWT válido para este rol>"
  }
}
```

> El frontend usa exactamente `response.data.data`, igual que el login normal.  
> El `token` debe ser un JWT real que el backend acepte en las rutas protegidas.

**Consideraciones:**
- No requiere autenticación previa (es ruta pública, como `/user/login`).
- Puede tener un usuario demo pre-creado por rol en la base de datos, o generarlos dinámicamente.
- El token puede tener expiración larga (ej. 30 días) para comodidad del demo.

---

### 2. Datos de demo en la base de datos

El endpoint anterior devuelve un `farm_assigned` real. Esa granja demo debe tener datos cargados para que la navegación sea útil:

- **Porcinos**: algunos cerdos con historial (peso, salud, reproducción)
- **Grupos**: al menos un grupo en cada etapa (destete, crecimiento, finalización)
- **Almacén**: productos con stock, movimientos de entradas/salidas
- **Reproducción**: inseminaciones y gestaciones registradas
- **Reportes**: suficientes registros para que las gráficas no aparezcan vacías

> La calidad del demo depende de la calidad de los datos. Con datos vacíos las pantallas se ven en blanco.

---

### 3. Variable de entorno del backend (si aplica)

Si el backend necesita saber que está en modo demo (para permisos especiales o para habilitar el endpoint `/user/demo-login` solo en demo), agregar:

```
DEMO_MODE=true
```

Y proteger el endpoint para que **solo esté disponible** cuando `DEMO_MODE=true`, evitando que exista en producción.
