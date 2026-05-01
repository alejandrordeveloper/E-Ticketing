# API Gateway

Este servicio funciona como punto de entrada HTTP del proyecto E-ticket. En el Sprint 1 se usó para recibir peticiones del cliente y reenviarlas al Auth Service.

## Responsabilidad actual

En el estado actual del proyecto, el Gateway:

- expone endpoints HTTP públicos
- habilita `CORS`
- aplica rate limiting global
- valida payloads con `ValidationPipe`
- reenvía peticiones de autenticación al Auth Service

## Dependencias principales

- `@nestjs/config`
- `@nestjs/axios`
- `@nestjs/throttler`
- `axios`

## Variables de entorno

El Gateway usa `services/api-gateway/.env`.

Variables actuales:

```env
PORT=3000
CORS_ORIGIN=*
AUTH_SERVICE_URL=http://localhost:8000
```

## Instalación

```powershell
cd services/api-gateway
npm install
```

## Ejecución

```powershell
npm run start:dev
```

El servicio queda disponible en `http://localhost:3000`.

## Configuración aplicada

### CORS

Se habilitó en `src/main.ts` con `origin` tomado desde `CORS_ORIGIN`.

### Validación global

Se usa `ValidationPipe` global con `whitelist: true`.

### Rate limiting

Se configuró `ThrottlerModule` con el siguiente límite:

- `20` requests por minuto por IP

## Endpoints del Sprint 1

### POST /auth/register

Reenvía la petición al Auth Service:

```text
POST {AUTH_SERVICE_URL}/register/
```

Body esperado:

```json
{
  "username": "usuario1",
  "email": "usuario1@email.com",
  "password": "Password123"
}
```

### POST /auth/login

Reenvía la petición al Auth Service:

```text
POST {AUTH_SERVICE_URL}/login/
```

Body esperado:

```json
{
  "email": "usuario1@email.com",
  "password": "Password123"
}
```

## Patrón API Gateway aplicado

En Sprint 1 se aplicó el patrón API Gateway de forma inicial.

- El cliente no consume directamente el Auth Service.
- El cliente habla con el Gateway.
- El Gateway centraliza acceso HTTP, CORS, validación y rate limiting.
- El Gateway decide a qué servicio interno reenviar la solicitud.

En esta etapa la comunicación entre Gateway y Auth se resolvió por HTTP usando `HttpService`.

## Tests disponibles

El proyecto Nest incluye la configuración base para:

```powershell
npm run test
npm run test:e2e
npm run test:cov
```

En Sprint 1 el foco principal de pruebas estuvo en el Auth Service.
