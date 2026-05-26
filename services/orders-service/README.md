# Orders Service

Este microservicio administra stock vendible y órdenes del proyecto E-ticket usando NestJS, PostgreSQL y Redis Pub/Sub.

## Responsabilidad actual

En el estado final de Sprint 3, este servicio se encarga de:

- inicializar stock por evento
- crear órdenes dentro de una transacción
- evitar sobreventa con locking pesimista
- listar órdenes confirmadas
- publicar `ORDER_CONFIRMED` en Redis
- validar payloads con DTOs
- responder errores con contrato JSON estandarizado
- exponer Swagger en `/api/docs`

## Endpoints

- `POST /orders/stock`
- `POST /orders`
- `GET /orders`

## Variables de entorno

Archivo usado:

```text
services/orders-service/.env
```

Variables principales:

```env
PORT=3001
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_NAME=orders_db
DATABASE_USER=postgres
DATABASE_PASSWORD=your-db-password
DATABASE_SCHEMA=orders
TYPEORM_SYNCHRONIZE=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_ORDER_CONFIRMED_CHANNEL=ORDER_CONFIRMED
```

## Ejecución local

```powershell
cd services/orders-service
npm install
npm run start:dev
```

Disponible normalmente en `http://localhost:3001`.

## Swagger

La documentación OpenAPI queda disponible en:

```text
http://localhost:3001/api/docs
```

## Lógica de compra

La creación de órdenes sigue este flujo:

1. buscar `EventStock` por `eventId`
2. bloquear la fila con `pessimistic_write`
3. validar disponibilidad
4. descontar inventario
5. guardar la orden con estado `confirmed`
6. publicar `ORDER_CONFIRMED` en Redis

## Calidad aplicada

- `ValidationPipe` global
- filtro global de excepciones
- logging estructurado JSON
- pruebas de concurrencia y publisher

## Pruebas

```powershell
npm run test
npm run test:e2e
npm run test:cov -- --runInBand
```

Cobertura validada en Sprint 3:

- `87.44%`
