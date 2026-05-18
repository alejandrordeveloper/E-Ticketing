# Sprint 2: Eventos, Órdenes, Concurrencia y Notificaciones

## Objetivo del sprint

El objetivo de este sprint fue implementar la lógica principal de negocio de E-ticket para poder publicar eventos, administrar stock vendible, procesar compras sin sobreventa y propagar confirmaciones de compra hacia un servicio de notificaciones.

## Arquitectura implementada

Durante este sprint se consolidó una arquitectura basada en microservicios con responsabilidades separadas.

- El cliente sigue consumiendo el API Gateway como punto de entrada.
- El API Gateway expone rutas HTTP para eventos y órdenes.
- El `events-service` gestiona el catálogo público de eventos usando MongoDB.
- El `orders-service` administra el stock vendible real y las órdenes usando PostgreSQL.
- El `orders-service` publica eventos de compra confirmada en Redis.
- El `notifications-service` consume esos eventos desde Redis y simula el envío de notificaciones mediante logs.

Los diagramas base del proyecto siguen estando en:

- [diagrama-arquitectura.md](./diagrama-arquitectura.md)
- [diagrama-er.md](./diagrama-er.md)

## Decisiones principales del sprint

Durante este sprint se fijaron estas reglas de arquitectura:

- El microservicio de catálogo de eventos quedó implementado en `events-service`.
- El inventario inicial del evento se guarda junto con el catálogo en MongoDB.
- El stock vendible real se controla en `orders-service` usando PostgreSQL.
- La concurrencia se resuelve con transacciones y locking pesimista.
- La comunicación asíncrona entre órdenes y notificaciones se implementó con Redis Pub/Sub.
- El API Gateway protege las rutas de órdenes validando JWT.

## Events Service

El microservicio de eventos se implementó en NestJS con MongoDB.

### Responsabilidad principal

`events-service` se encarga de:

- crear eventos
- listar eventos
- almacenar nombre, descripción, fecha e inventario inicial

### Configuración aplicada

En este servicio se configuró:

- conexión a MongoDB con `MongooseModule`
- un módulo dedicado `EventsModule`
- un schema `Event`
- un DTO para validación de creación de eventos

### Endpoints expuestos por Events

- `POST /events`
- `GET /events`

## Orders Service

El microservicio de órdenes se implementó en NestJS con PostgreSQL y TypeORM.

### Responsabilidad principal

`orders-service` se encarga de:

- inicializar o reiniciar stock vendible por evento
- crear órdenes
- validar inventario disponible
- evitar sobreventa bajo concurrencia
- persistir órdenes confirmadas

### Configuración aplicada

En este servicio se configuró:

- lectura de variables de entorno desde `services/orders-service/.env`
- conexión PostgreSQL con `TypeOrmModule`
- creación automática del schema `orders` si no existe
- entidades `Order` y `EventStock`
- publicación de eventos `ORDER_CONFIRMED` hacia Redis

### Endpoints expuestos por Orders

- `POST /orders/stock`
- `POST /orders`
- `GET /orders`

### Lógica de negocio implementada

La creación de órdenes se resolvió dentro de una transacción.

El flujo implementado fue:

1. Buscar el stock del evento.
2. Bloquear la fila correspondiente con `pessimistic_write`.
3. Validar que exista stock para el evento.
4. Validar que la cantidad solicitada no supere el inventario disponible.
5. Descontar inventario.
6. Guardar la orden con estado `confirmed`.
7. Publicar el evento `ORDER_CONFIRMED` en Redis.

Con esto se evita que dos compras concurrentes consuman el mismo último cupo disponible.

## Control de concurrencia

La parte más importante del sprint fue garantizar que no hubiera sobreventa.

### Estrategia aplicada

La estrategia usada fue:

- transacciones de base de datos en PostgreSQL
- locking pesimista sobre `EventStock`
- validación de inventario dentro de la misma transacción

### Resultado esperado

Cuando solo queda una unidad disponible y dos compras llegan al mismo tiempo:

- una compra debe confirmarse
- la otra debe fallar con conflicto
- el stock final debe quedar en `0`
- solo debe persistirse una orden

## Notifications Service

El servicio de notificaciones se implementó en Django.

### Responsabilidad principal

`notifications-service` se encarga de:

- suscribirse al canal Redis `ORDER_CONFIRMED`
- recibir eventos de compra confirmada
- simular el envío de una notificación mediante logs

### Configuración aplicada

En este servicio se agregó:

- configuración Redis en `settings.py`
- arranque del consumidor desde `apps.py`
- archivo `consumer.py` con suscripción al canal y procesamiento del payload
- lógica para no levantar el consumidor durante tests, migraciones u otros comandos de administración

### Comportamiento implementado

Cuando `orders-service` publica un `ORDER_CONFIRMED`, el consumidor:

- recibe el mensaje
- interpreta el JSON
- registra un log indicando que la notificación fue simulada correctamente

## API Gateway

El Gateway se amplió para exponer el flujo Core del sistema.

### Funcionalidad agregada

En este sprint el Gateway quedó encargado de:

- mantener públicas las rutas de eventos
- proteger con JWT las rutas de órdenes
- reenviar peticiones hacia `events-service`
- reenviar peticiones hacia `orders-service`
- propagar el header `Authorization` hacia el servicio correspondiente

### Endpoints expuestos por el Gateway

#### Eventos

- `GET /events`
- `POST /events`

#### Órdenes

- `GET /orders`
- `POST /orders`
- `POST /orders/stock`

### Seguridad aplicada

Las rutas de órdenes quedaron protegidas con `JwtAuthGuard`.

La validación usada fue:

- lectura del header `Authorization`
- validación del formato `Bearer <token>`
- verificación del token usando el mismo secreto configurado en Auth

## Variables de entorno y configuración

En este sprint quedaron definidos nuevos archivos y variables de configuración.

### API Gateway

Archivo usado:

- `services/api-gateway/.env`

Variables importantes:

- `PORT`
- `CORS_ORIGIN`
- `AUTH_SERVICE_URL`
- `EVENTS_SERVICE_URL`
- `ORDERS_SERVICE_URL`
- `JWT_SECRET`

### Orders Service

Archivo usado:

- `services/orders-service/.env`

Variables importantes:

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

En Django se agregó configuración para:

- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_ORDER_CONFIRMED_CHANNEL`

## Cómo se levantó el proyecto en la práctica

### Paso 1. Infraestructura base

Desde la raíz:

```powershell
docker compose up
```

Esto deja disponibles PostgreSQL, MongoDB, Redis, NATS y el Auth Service.

### Paso 2. API Gateway

```powershell
cd services/api-gateway
npm install
npm run start:dev
```

El Gateway queda expuesto en `http://localhost:3000`.

### Paso 3. Events Service

```powershell
cd services/events-service
npm install
npm run start:dev
```

Normalmente este servicio se usa en `http://localhost:3002`.

### Paso 4. Orders Service

```powershell
cd services/orders-service
npm install
npm run start:dev
```

Normalmente este servicio se usa en `http://localhost:3001`.

### Paso 5. Notifications Service

```powershell
cd services/notifications-service
pip install -r requirements.txt
python manage.py runserver 8001
```

Este servicio levanta el consumidor Redis para escuchar compras confirmadas.

## Flujo funcional del sprint

Con el sistema levantado, el flujo principal fue:

1. El cliente obtiene un JWT desde autenticación.
2. El cliente crea o consulta eventos a través del Gateway.
3. El cliente inicializa stock vendible para un evento usando `POST /orders/stock`.
4. El cliente crea una orden usando `POST /orders`.
5. El `orders-service` valida inventario, bloquea stock y registra la compra.
6. El `orders-service` publica `ORDER_CONFIRMED` en Redis.
7. El `notifications-service` consume el evento y registra la notificación simulada.
8. El cliente puede consultar las órdenes creadas con `GET /orders`.

## Validación funcional del sprint

El sprint se validó de dos formas.

### Pruebas manuales con Insomnia

Se agregó una colección nueva en la carpeta `insomnia/`:

- `Insomnia_Core`

Esa colección permite probar:

- listado de eventos
- creación de eventos
- inicialización de stock
- creación de órdenes
- listado de órdenes

### Pruebas automáticas

Se agregaron o actualizaron pruebas en los servicios de este sprint.

#### Events Service

Se validó:

- controlador de eventos
- creación de eventos
- listado de eventos
- rutas HTTP básicas

#### Orders Service

Se validó:

- creación o reinicio de stock
- creación de órdenes confirmadas
- error cuando no existe stock
- error por inventario insuficiente
- listado de órdenes
- publicación de `ORDER_CONFIRMED`

#### Concurrencia

Se agregó una prueba e2e específica para validar que, cuando solo queda una entrada disponible, dos compras paralelas produzcan este resultado:

- una respuesta `201`
- una respuesta `409`
- una sola orden persistida
- stock final en `0`

#### Notifications Service

Se validó:

- procesamiento del payload `ORDER_CONFIRMED`
- registro del log esperado
- no arranque del consumidor durante tests

## Comandos de prueba usados

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

## Resultado del sprint

Al cierre de Sprint 2 el proyecto quedó con la lógica principal de negocio ya implementada.

Este sprint dejó resueltos:

- catálogo de eventos en MongoDB
- stock vendible real en PostgreSQL
- creación de órdenes
- control de concurrencia para evitar sobreventa
- publicación de eventos de compra confirmada con Redis
- consumo de notificaciones desde Django
- rutas Core expuestas a través del API Gateway
- colección de Insomnia para validación manual del flujo completo
