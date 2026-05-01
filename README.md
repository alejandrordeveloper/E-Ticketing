# E-ticket

E-ticket es una plataforma orientada a microservicios para gestionar autenticación, eventos, pedidos y notificaciones. En este primer sprint se construyó la base técnica del proyecto: infraestructura local con Docker Compose, un Auth Service en Django REST Framework, un API Gateway en NestJS, autenticación con JWT, pruebas automáticas básicas y colecciones de Insomnia para validación manual.

## Estado del Sprint 1

Completado en este sprint:

- Infraestructura local con Docker Compose para PostgreSQL, MongoDB, Redis y NATS.
- Auth Service en Django + DRF con registro, login y refresh token.
- API Gateway en NestJS con CORS, validación global y rate limiting.
- Proxy del Gateway hacia Auth para `/auth/register` y `/auth/login`.
- Usuario personalizado con autenticación por email.
- Hash de contraseñas con Argon2.
- Variables de entorno para Docker y para desarrollo local.
- Pruebas automáticas del módulo de autenticación.
- Diagramas de arquitectura y ER.
- Colecciones de Insomnia para pruebas manuales.

## Estructura del repositorio

```text
.
├── docker-compose.yml
├── docs/
│   ├── diagrama-arquitectura.md
│   ├── diagrama-er.md
│   └── sprint-1.md
├── insomnia/
├── services/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── events-service/
│   ├── notifications-service/
│   └── orders-service/
└── .env.example
```

## Requisitos

Para levantar el proyecto en el estado actual del Sprint 1 necesitas:

- Docker Desktop
- Node.js y npm
- Python 3
- Un entorno virtual Python en la raíz del repo

## Variables de entorno

El archivo [./.env.example](./.env.example) contiene la plantilla general del proyecto.

En este sprint quedaron definidos estos archivos de configuración:

- `services/api-gateway/.env`: configuración local del Gateway.
- `services/auth-service/.env`: configuración del Auth Service dentro de Docker.
- `services/auth-service/.env.local`: configuración del Auth Service fuera de Docker.

La diferencia importante entre local y Docker es la base de datos:

- Dentro de Docker, PostgreSQL se alcanza por `postgres-db:5432`.
- Fuera de Docker, PostgreSQL se alcanza por `localhost:5433`.

## Cómo levantar el proyecto

### 1. Levantar la infraestructura base

Desde la raíz del repositorio:

```powershell
docker compose up
```

Esto levanta:

- `postgres-db`
- `mongo-db`
- `redis-db`
- `nats-server`
- `auth-service`

### 2. Levantar el API Gateway

En una terminal nueva:

```powershell
cd services/api-gateway
npm install
npm run start:dev
```

El Gateway queda expuesto en `http://localhost:3000`.

### 3. Flujo funcional del Sprint 1

Con el sistema levantado, el flujo principal es:

- Cliente llama `POST http://localhost:3000/auth/register`
- Gateway reenvía a `POST http://localhost:8000/register/`
- Cliente llama `POST http://localhost:3000/auth/login`
- Gateway reenvía a `POST http://localhost:8000/login/`

## Cómo correr Auth localmente

Si necesitas ejecutar el Auth Service fuera de Docker:

```powershell
cd services/auth-service
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

En este caso el servicio usa `services/auth-service/.env.local` si existe. Si no existe, usa `services/auth-service/.env`.

## Tests de autenticación

Desde `services/auth-service`:

```powershell
python manage.py test users
```

Para cobertura:

```powershell
coverage run manage.py test users
coverage report -m
coverage html
```

El reporte HTML se genera en `services/auth-service/htmlcov/index.html`.

## Documentación relacionada

- [docs/sprint-1.md](./docs/sprint-1.md)
- [docs/diagrama-arquitectura.md](./docs/diagrama-arquitectura.md)
- [docs/diagrama-er.md](./docs/diagrama-er.md)
- [services/api-gateway/README.md](./services/api-gateway/README.md)
- [services/auth-service/README.md](./services/auth-service/README.md)
- [insomnia/README.md](./insomnia/README.md)