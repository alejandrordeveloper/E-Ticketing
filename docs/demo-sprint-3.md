# Demo Sprint 3

## Objetivo

Este guion permite mostrar el sistema E-ticket de punta a punta en una demo corta, con foco en arquitectura, flujo funcional, documentación viva y evidencia de calidad.

## Preparación previa

Antes de iniciar la demo conviene tener:

- `docker compose up --build` ejecutado desde la raíz
- Swagger accesible en los cuatro servicios HTTP
- una terminal visible con logs de `notifications-service`
- Insomnia listo con las colecciones del proyecto

## Flujo sugerido de demo

### 1. Presentar arquitectura en 30-45 segundos

Mostrar:

- [docs/diagrama-arquitectura.md](./diagrama-arquitectura.md)
- [docs/diagrama-secuencia-compra.md](./diagrama-secuencia-compra.md)

Mensaje clave:

- el cliente entra por `api-gateway`
- autenticación vive en `auth-service`
- catálogo en `events-service`
- stock real y órdenes en `orders-service`
- confirmaciones asíncronas en `notifications-service` vía Redis

### 2. Mostrar documentación Swagger

Abrir rápidamente:

- `http://localhost:3000/api/docs`
- `http://localhost:3002/api/docs`
- `http://localhost:3001/api/docs`
- `http://localhost:8000/api/docs/`

Mensaje clave:

- el proyecto tiene contratos HTTP visibles y navegables
- esto facilita pruebas manuales, integración y revisión técnica

### 3. Registrar o autenticar un usuario

Ejecutar desde Insomnia o Swagger:

- `POST /auth/register`
- `POST /auth/login`

Resultado esperado:

- obtener `access` y `refresh`
- copiar el token `Bearer` para las rutas protegidas

### 4. Crear un evento y consultar catálogo

Ejecutar:

- `POST /events`
- `GET /events`

Mensaje clave:

- el catálogo se guarda en `events-service`
- este inventario representa el dato de catálogo, no el stock transaccional real

### 5. Inicializar stock vendible

Ejecutar con JWT:

- `POST /orders/stock`

Mensaje clave:

- el stock real vive en `orders-service`
- esta separación evita mezclar catálogo público con inventario transaccional

### 6. Crear una orden

Ejecutar con JWT:

- `POST /orders`

Mensaje clave:

- la orden se crea dentro de una transacción
- se valida inventario y se evita sobreventa
- al confirmar, se publica `ORDER_CONFIRMED` en Redis

### 7. Mostrar evidencia asíncrona

En la terminal de `notifications-service`, mostrar el log de consumo.

Mensaje clave:

- la orden confirmada dispara un evento
- `notifications-service` lo recibe y simula la notificación

### 8. Mostrar evidencia de calidad

Cerrar la demo enseñando:

- [docs/sprint-3.md](./sprint-3.md)
- cobertura final por servicio
- manejo global de errores y validación documentados

Resultados de coverage:

- `api-gateway`: `92.17%`
- `events-service`: `87.21%`
- `orders-service`: `87.44%`
- `auth-service`: `93%`
- `notifications-service`: `91%`

## Cierre sugerido

Una frase útil para cerrar la exposición:

"El proyecto quedó con separación clara de responsabilidades, documentación navegable, validación de entradas, manejo consistente de errores y cobertura superior al umbral exigido en todos los servicios."