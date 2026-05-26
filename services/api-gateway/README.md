# API Gateway

El API Gateway es el punto de entrada HTTP del proyecto E-ticket. Centraliza autenticación, exposición de eventos y acceso protegido a órdenes.

## Responsabilidad actual

En el estado final de Sprint 3, este servicio se encarga de:

- exponer endpoints HTTP para autenticación, eventos y órdenes
- reenviar autenticación a `auth-service`
- reenviar catálogo a `events-service`
- reenviar stock y órdenes a `orders-service`
- validar JWT en rutas protegidas de órdenes
- validar payloads con DTOs y `ValidationPipe`
- unificar manejo de errores HTTP
- exponer Swagger en `/api/docs`

## Endpoints principales

### Autenticación

- `POST /auth/register`
- `POST /auth/login`

### Eventos

- `GET /events`
- `POST /events`

### Órdenes

- `GET /orders`
- `POST /orders`
- `POST /orders/stock`

## Variables de entorno

Archivo usado:

```text
services/api-gateway/.env
```

Variables principales:

```env
PORT=3000
CORS_ORIGIN=*
AUTH_SERVICE_URL=http://localhost:8000
EVENTS_SERVICE_URL=http://localhost:3002
ORDERS_SERVICE_URL=http://localhost:3001
JWT_SECRET=your-secret-key
```

## Ejecución local

```powershell
cd services/api-gateway
npm install
npm run start:dev
```

Disponible en `http://localhost:3000`.

## Swagger

La documentación OpenAPI queda disponible en:

```text
http://localhost:3000/api/docs
```

## Calidad aplicada

- `ValidationPipe` global con whitelist y transformación
- filtros globales de excepciones con contrato JSON unificado
- logging estructurado JSON
- `JwtAuthGuard` para proteger rutas de órdenes

## Pruebas

```powershell
npm run test
npm run test:e2e
npm run test:cov -- --runInBand
```

Cobertura validada en Sprint 3:

- `92.17%`

## Relación con otros servicios

- `auth-service` mantiene usuarios y JWT
- `events-service` mantiene el catálogo público
- `orders-service` controla stock vendible y órdenes
