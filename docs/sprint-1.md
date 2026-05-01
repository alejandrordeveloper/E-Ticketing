# Sprint 1: Fundación, Arquitectura y Autenticación

## Objetivo del sprint

El objetivo de este sprint fue dejar construida la base técnica del proyecto E-ticket para poder autenticar usuarios, enrutar peticiones a través de un API Gateway y trabajar localmente con una infraestructura reproducible.

## Arquitectura implementada

Durante este sprint se dejó definida una arquitectura basada en microservicios.

- El cliente consume el API Gateway.
- El API Gateway recibe peticiones HTTP y reenvía operaciones de autenticación al Auth Service.
- El Auth Service usa PostgreSQL como base de datos principal.
- Redis, MongoDB y NATS quedaron disponibles como parte de la infraestructura general del proyecto.

Los diagramas del sprint están en:

- [diagrama-arquitectura.md](./diagrama-arquitectura.md)
- [diagrama-er.md](./diagrama-er.md)

## Infraestructura local

La infraestructura se definió en [../docker-compose.yml](../docker-compose.yml).

Servicios incluidos:

- `nats-server`
- `postgres-db`
- `mongo-db`
- `redis-db`
- `auth-service`

### Puertos expuestos

- NATS: `4222`
- Monitor de NATS: `8222`
- PostgreSQL: `5433` en host, `5432` dentro del contenedor
- MongoDB: `27018` en host, `27017` dentro del contenedor
- Redis: `6379`
- Auth Service: `8000`

## API Gateway

El Gateway se implementó en NestJS.

### Dependencias instaladas

Las dependencias principales del sprint fueron:

- `@nestjs/axios`
- `@nestjs/config`
- `@nestjs/throttler`
- `axios`
- `class-validator`
- `class-transformer`

### Configuración aplicada

En el Gateway se configuró:

- lectura global de variables de entorno
- `CORS`
- `ValidationPipe` global
- rate limiting global con `20` requests por minuto por IP

### Endpoints expuestos por el Gateway

- `POST /auth/register`
- `POST /auth/login`

El Gateway reenvía esas peticiones al Auth Service usando `HttpModule` y `HttpService`.

## Auth Service

El microservicio de autenticación se implementó con Django y Django REST Framework.

### Dependencias instaladas

- `Django`
- `djangorestframework`
- `psycopg2-binary`
- `python-dotenv`
- `djangorestframework-simplejwt`
- `argon2-cffi`

### Decisiones principales

- Se usó un modelo de usuario personalizado.
- El campo principal de autenticación es `email`.
- `username` sigue siendo obligatorio como campo adicional.
- Las contraseñas se almacenan usando Argon2.
- DRF quedó configurado para usar JWT.

### Endpoints expuestos por Auth

- `POST /register/`
- `POST /login/`
- `POST /token/`

### JWT configurado

Configuración actual:

- Access Token: `15 minutos`
- Refresh Token: `3 días`
- Tipo de encabezado: `Bearer`

## Variables de entorno y diferencia entre Docker y local

En este sprint se dejó soporte para dos formas de ejecución del Auth Service:

### Dentro de Docker

Archivo usado: `services/auth-service/.env`

Valores esperados:

- `DATABASE_HOST=postgres-db`
- `DATABASE_PORT=5432`

### Fuera de Docker

Archivo usado: `services/auth-service/.env.local`

Valores esperados:

- `DATABASE_HOST=localhost`
- `DATABASE_PORT=5433`

Esto se hizo porque dentro de la red Docker el servicio de PostgreSQL se resuelve por nombre de contenedor, mientras que desde Windows se usa el puerto mapeado en el host.

## Cómo se levantó el proyecto en la práctica

### Paso 1. Infraestructura

Desde la raíz:

```powershell
docker compose up
```

### Paso 2. API Gateway

```powershell
cd services/api-gateway
npm install
npm run start:dev
```

### Paso 3. Auth local, cuando fue necesario

```powershell
cd services/auth-service
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

## Validación funcional del sprint

El sprint se validó de dos formas:

### Pruebas manuales con Insomnia

Se agregaron exportaciones de Insomnia en la carpeta `insomnia/`:

- `Insomnia_Django`
- `Insomnia_Nestjs`

### Pruebas automáticas del Auth Service

Se agregaron pruebas en `services/auth-service/users/tests.py` para cubrir:

- registro exitoso
- login exitoso
- registro con email duplicado
- login con contraseña incorrecta
- login con email inexistente
- registro sin email
- registro sin password
- refresh token exitoso

Comando usado:

```powershell
python manage.py test users
```

## Cobertura

Se usó `coverage` para medir cobertura sobre el Auth Service.

Comandos usados:

```powershell
coverage run manage.py test users
coverage report -m
coverage html
```

## Resultado del sprint

Al cierre de Sprint 1 quedó lista la base del proyecto para continuar con eventos, órdenes, notificaciones y comunicación más avanzada entre servicios.

Este sprint dejó resueltos:

- arquitectura inicial
- entorno reproducible de desarrollo
- autenticación funcional
- JWT
- Gateway operativo
- pruebas automáticas iniciales
- documentación base y diagramas