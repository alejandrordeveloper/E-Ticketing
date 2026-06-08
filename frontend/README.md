# E-ticket Frontend

Frontend React + TypeScript + Vite para exponer el flujo principal del proyecto E-ticket desde una sola página.

## Qué incluye

- catálogo de eventos consumiendo `GET /events`
- login y registro contra `POST /auth/login` y `POST /auth/register`
- checkout con compra protegida por JWT usando `POST /orders`
- historial con `GET /orders`
- consola demo para crear eventos y cargar stock con `POST /events` y `POST /orders/stock`

## Requisitos

- backend levantado desde la raíz con `docker compose up --build`
- gateway disponible en `http://localhost:3000`

## Variables de entorno

Copia `.env.example` a `.env` si necesitas apuntar a otra URL:

```powershell
Copy-Item .env.example .env
```

Variable disponible:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_BACKSTAGE_ADMIN_EMAIL=admin@eticket.com
```

## Backstage demo access

La vista `http://localhost:5173/backstage` usa una cuenta demo fija para desbloquear las acciones operativas.

- email: `admin@eticket.com`
- password: `admin123`

El frontend solo habilita `Backstage` con esa cuenta demo y el gateway valida el JWT antes de permitir `POST /events` y `POST /orders/stock`.

## Desarrollo

```powershell
cd frontend
npm run dev
```

La app queda disponible normalmente en `http://localhost:5173`.

## Build

```powershell
cd frontend
npm run build
```

## Nota de arquitectura

El frontend consume solo el API Gateway. El catálogo visible proviene de `events-service`, mientras que el stock vendible y las órdenes siguen siendo responsabilidad de `orders-service`.
