# Events Service

Este microservicio expone el catálogo público de eventos del proyecto E-ticket usando NestJS y MongoDB.

## Responsabilidad actual

En el estado final de Sprint 3, este servicio se encarga de:

- crear eventos
- listar eventos
- almacenar nombre, descripción, fecha e inventario inicial
- validar payloads con DTOs
- responder errores con contrato JSON estandarizado
- exponer Swagger en `/api/docs`

## Endpoints

- `POST /events`
- `GET /events`

## Variables de entorno

Archivo usado:

```text
services/events-service/.env
```

Variables típicas:

```env
PORT=3002
MONGO_URI=mongodb://localhost:27018/events_db
```

## Ejecución local

```powershell
cd services/events-service
npm install
npm run start:dev
```

Disponible normalmente en `http://localhost:3002`.

## Swagger

La documentación OpenAPI queda disponible en:

```text
http://localhost:3002/api/docs
```

## Calidad aplicada

- `ValidationPipe` global
- filtro global de excepciones
- logging estructurado JSON
- DTOs documentados con `@nestjs/swagger`

## Pruebas

```powershell
npm run test
npm run test:e2e
npm run test:cov -- --runInBand
```

Cobertura validada en Sprint 3:

- `87.21%`
