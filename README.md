# E-ticket

E-ticket es una plataforma orientada a microservicios para gestionar autenticación, eventos, órdenes y notificaciones. El proyecto se construyó en dos sprints: el primero dejó la base técnica de autenticación e infraestructura, y el segundo implementó la lógica principal de negocio con catálogo de eventos, stock vendible, control de concurrencia y notificaciones asíncronas.

## Estado actual del proyecto

Al cierre de los dos sprints, el proyecto incluye:

- infraestructura local con Docker Compose para PostgreSQL, MongoDB, Redis y NATS
- Auth Service en Django REST Framework con registro, login y refresh token
- API Gateway en NestJS como puerta de entrada HTTP
- Events Service en NestJS con MongoDB para el catálogo público de eventos
- Orders Service en NestJS con PostgreSQL para stock vendible y órdenes
- Notifications Service en Django para consumo de eventos `ORDER_CONFIRMED`
- validación JWT en el Gateway para proteger las rutas de órdenes
- pruebas automáticas unitarias y e2e en los servicios principales
- colecciones de Insomnia para validación manual

## Arquitectura general

La arquitectura actual del proyecto queda distribuida así:

- El cliente consume el API Gateway.
- El API Gateway reenvía autenticación hacia `auth-service`.
- El API Gateway expone eventos y órdenes hacia los servicios Core.
- `auth-service` gestiona usuarios y JWT usando PostgreSQL.
- `events-service` gestiona el catálogo público en MongoDB.
- `orders-service` controla stock real y órdenes en PostgreSQL.
- `orders-service` publica `ORDER_CONFIRMED` usando Redis Pub/Sub.
- `notifications-service` consume esos eventos y simula notificaciones mediante logs.

## Estructura del repositorio

```text
.
├── docker-compose.yml
├── docs/
│   ├── diagrama-arquitectura.md
│   ├── diagrama-er.md
│   ├── sprint-1.md
│   └── sprint-2.md
├── insomnia/
├── services/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── events-service/
│   ├── notifications-service/
│   └── orders-service/
└── .env.example
```

## Servicios y responsabilidades

### API Gateway

Responsable de:

- exponer el punto de entrada HTTP del sistema
- reenviar autenticación a `auth-service`
- reenviar eventos a `events-service`
- reenviar órdenes a `orders-service`
- validar JWT en rutas protegidas de órdenes

### Auth Service

Responsable de:

- registro de usuario
- login
- refresh token
- autenticación con email

### Events Service

Responsable de:

- crear eventos
- listar eventos
- almacenar nombre, descripción, fecha e inventario inicial

### Orders Service

Responsable de:

- inicializar stock vendible por evento
- procesar compras
- validar inventario disponible
- evitar sobreventa con transacciones y locking
- guardar órdenes confirmadas
- publicar `ORDER_CONFIRMED` en Redis

### Notifications Service

Responsable de:

- escuchar el canal Redis `ORDER_CONFIRMED`
- consumir compras confirmadas
- simular el envío de notificaciones mediante logs

## Requisitos

Para levantar el proyecto completo necesitas:

- Docker Desktop
- Node.js y npm
- Python 3
- un entorno virtual Python en la raíz del repositorio

## Variables de entorno

El archivo [./.env.example](./.env.example) contiene la plantilla general del proyecto.

Los archivos de configuración importantes son:

- `services/api-gateway/.env`
- `services/auth-service/.env`
- `services/auth-service/.env.local`
- `services/orders-service/.env`

Variables relevantes por servicio:

### API Gateway

- `PORT`
- `CORS_ORIGIN`
- `AUTH_SERVICE_URL`
- `EVENTS_SERVICE_URL`
- `ORDERS_SERVICE_URL`
- `JWT_SECRET`

### Auth Service

- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_NAME`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `SECRET_KEY`

### Orders Service

- `PORT`
- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_NAME`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `DATABASE_SCHEMA`
- `TYPEORM_SYNCHRONIZE`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_ORDER_CONFIRMED_CHANNEL`

### Notifications Service

- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_ORDER_CONFIRMED_CHANNEL`

La diferencia principal entre Docker y ejecución local está en PostgreSQL:

- dentro de Docker se usa `postgres-db:5432`
- fuera de Docker se usa `localhost:5433`

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

### 3. Levantar Events Service

En otra terminal:

```powershell
cd services/events-service
npm install
npm run start:dev
```

Normalmente queda expuesto en `http://localhost:3002`.

### 4. Levantar Orders Service

En otra terminal:

```powershell
cd services/orders-service
npm install
npm run start:dev
```

Normalmente queda expuesto en `http://localhost:3001`.

### 5. Levantar Notifications Service

En otra terminal:

```powershell
cd services/notifications-service
pip install -r requirements.txt
python manage.py runserver 8001
```

Este servicio queda escuchando eventos `ORDER_CONFIRMED` desde Redis.

## Sprint 2 paso a paso

El Sprint 2 implementa el flujo principal de negocio del sistema. A nivel de proyecto principal, el recorrido completo es este.

### Paso 1. Obtener autenticación

Primero el cliente debe registrarse o iniciar sesión para obtener un JWT.

Flujo:

- Cliente llama `POST http://localhost:3000/auth/register`
- Gateway reenvía a `POST http://localhost:8000/register/`
- Cliente llama `POST http://localhost:3000/auth/login`
- Gateway reenvía a `POST http://localhost:8000/login/`
- Auth devuelve el access token

Ese token se usa después en las rutas protegidas de órdenes.

### Paso 2. Crear o consultar eventos

Con los servicios arriba, el cliente puede trabajar con el catálogo público de eventos a través del Gateway.

Rutas:

- `GET http://localhost:3000/events`
- `POST http://localhost:3000/events`

En este punto `events-service` guarda en MongoDB:

- nombre
- descripción
- fecha
- inventario inicial

### Paso 3. Inicializar el stock vendible real

Después de crear un evento, el siguiente paso es preparar el stock real que sí será descontado durante las compras.

Ruta:

- `POST http://localhost:3000/orders/stock`

Esta operación:

- requiere JWT
- pasa por el Gateway
- llega a `orders-service`
- crea o reinicia el registro `EventStock` en PostgreSQL

Aquí queda definido el inventario realmente disponible para venta.

### Paso 4. Crear una orden

Con stock inicializado, el cliente puede comprar usando:

- `POST http://localhost:3000/orders`

Esta operación:

- requiere JWT
- pasa por el Gateway
- llega a `orders-service`
- se ejecuta dentro de una transacción

Dentro de esa transacción se hace este proceso:

1. Buscar el stock por `eventId`.
2. Bloquear la fila con `pessimistic_write`.
3. Validar que el stock exista.
4. Validar que haya inventario suficiente.
5. Descontar la cantidad comprada.
6. Guardar la orden con estado `confirmed`.

### Paso 5. Controlar concurrencia y evitar sobreventa

Este fue el punto central del Sprint 2.

Cuando dos compras intentan consumir la última unidad disponible al mismo tiempo:

- una compra debe confirmarse
- la otra debe responder con conflicto
- el inventario final debe quedar consistente

Esto se resolvió con:

- transacciones en PostgreSQL
- locking pesimista sobre `EventStock`
- validación de stock dentro de la misma transacción

### Paso 6. Publicar evento de compra confirmada

Una vez guardada la orden, `orders-service` publica un evento de dominio:

- `ORDER_CONFIRMED`

Ese evento se envía por Redis Pub/Sub y contiene la información necesaria de la compra confirmada.

### Paso 7. Consumir el evento en Notifications Service

`notifications-service` queda suscrito al canal Redis configurado para compras confirmadas.

Cuando llega un `ORDER_CONFIRMED`:

- el consumidor recibe el mensaje
- interpreta el payload JSON
- registra un log simulando el envío de la notificación

Con esto queda implementada la comunicación asíncrona entre órdenes y notificaciones.

### Paso 8. Consultar las órdenes creadas

Finalmente el cliente puede listar órdenes usando:

- `GET http://localhost:3000/orders`

Esta ruta:

- requiere JWT
- pasa por el Gateway
- consulta `orders-service`
- devuelve las órdenes ordenadas por fecha de creación

## Cómo validar manualmente el Sprint 2

La forma recomendada de validar el flujo completo es usando Insomnia.

Colecciones disponibles:

- `insomnia/Insomnia_Django`
- `insomnia/Insomnia_Nestjs`
- `insomnia/Insomnia_Core`

Orden sugerido de prueba:

1. Registrar o loguear usuario.
2. Copiar el access token.
3. Ejecutar `POST /events`.
4. Ejecutar `GET /events`.
5. Ejecutar `POST /orders/stock` con token.
6. Ejecutar `POST /orders` con token.
7. Ejecutar `GET /orders` con token.
8. Revisar logs de `notifications-service` para confirmar consumo del evento.

## Tests del proyecto

### Auth Service

```powershell
cd services/auth-service
python manage.py test users
```

Para cobertura:

```powershell
coverage run manage.py test users
coverage report -m
coverage html
```

### Events Service

```powershell
cd services/events-service
npm run test
npm run test:e2e
```

### Orders Service

```powershell
cd services/orders-service
npm run test
npm run test:e2e
```

### Notifications Service

```powershell
cd services/notifications-service
python manage.py test notifications
```

### API Gateway

```powershell
cd services/api-gateway
npm run test
npm run test:e2e
```

## Documentación relacionada

- [docs/sprint-1.md](./docs/sprint-1.md)
- [docs/sprint-2.md](./docs/sprint-2.md)
- [docs/diagrama-arquitectura.md](./docs/diagrama-arquitectura.md)
- [docs/diagrama-er.md](./docs/diagrama-er.md)
- [services/api-gateway/README.md](./services/api-gateway/README.md)
- [services/auth-service/README.md](./services/auth-service/README.md)
- [insomnia/README.md](./insomnia/README.md)

## Decisiones de arquitectura de Sprint 2

Para la lógica de negocio y concurrencia se fijaron estas reglas:

- el microservicio de reservas se resolvió sobre el ya existente `orders-service`
- el catálogo público de eventos quedó en MongoDB bajo `events-service`
- el stock vendible real quedó en PostgreSQL bajo `orders-service`
- la concurrencia se resolvió con transacciones, locking y validación de inventario
- la comunicación de compra confirmada se resolvió con Redis Pub/Sub
- `notifications-service` consume `ORDER_CONFIRMED` y simula el envío de notificaciones mediante logs
