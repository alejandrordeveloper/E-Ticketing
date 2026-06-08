# Frontend E-ticket

## Objetivo del frontend

El frontend de E-ticket es la capa visual de demostración del sistema. Su propósito no es reemplazar la separación de responsabilidades del backend, sino exponerla de manera comprensible desde una sola interfaz.

Desde la aplicación web se pueden demostrar dos recorridos principales:

- el flujo comprador, donde un usuario descubre eventos, inicia sesión, compra tickets y consulta sus órdenes
- el flujo operativo `Backstage`, donde un administrador demo crea eventos de catálogo e inicializa stock vendible real

La idea central del frontend es hacer evidente la diferencia entre:

- catálogo público de eventos, responsabilidad de `events-service`
- stock transaccional y órdenes, responsabilidad de `orders-service`

Esta distinción era importante en la arquitectura del proyecto y el frontend fue diseñado para enseñarla claramente durante la demo.

## Stack técnico

El frontend está construido con:

- React
- TypeScript
- Vite
- CSS plano, sin framework de componentes externo

La aplicación vive en la carpeta `frontend/` del repositorio y se ejecuta de forma independiente a los microservicios, pero consume únicamente el `api-gateway`.

## Principio de integración

El frontend nunca consume servicios internos de forma directa.

Todas las solicitudes salen hacia el gateway configurado por `VITE_API_BASE_URL`, que por defecto apunta a:

```env
http://localhost:3000
```

Eso significa que el frontend no conoce direcciones internas como:

- `auth-service:8000`
- `events-service:3002`
- `orders-service:3001`

Esa decisión mantiene el mismo borde de integración que tendría un cliente real y evita acoplar la interfaz a la topología interna del sistema.

## Estructura funcional del frontend

La aplicación está pensada como una SPA pequeña con dos superficies principales:

- `/` para la experiencia pública y de compra
- `/backstage` para la experiencia operativa de demo

No se utilizó `react-router`. En su lugar, el archivo principal maneja la navegación con:

- `window.location.pathname`
- `history.pushState`
- el evento `popstate`

Esto mantiene el proyecto liviano y suficiente para el alcance de la demo.

## Responsabilidades del frontend

El frontend resuelve las siguientes responsabilidades:

- cargar el catálogo público de eventos
- filtrar y seleccionar eventos para compra
- registrar e iniciar sesión de usuarios
- persistir sesión de usuario en `localStorage`
- crear órdenes protegidas por JWT
- consultar historial de órdenes del usuario autenticado
- desbloquear un panel `Backstage` para la cuenta demo de administración
- permitir crear eventos y luego cargar stock vendible desde una secuencia guiada

No resuelve estas responsabilidades:

- autorización real compleja por múltiples roles
- pasarela de pagos
- recuperación de contraseña
- perfiles avanzados de usuario
- panel administrativo completo de producción

## Archivo principal y organización interna

La mayor parte de la lógica vive en `frontend/src/App.tsx`.

Ese archivo contiene:

- tipos base para eventos, órdenes, sesión y respuestas de autenticación
- helpers de fetch y manejo de errores
- helpers para decodificar JWT y extraer el `userId`
- helpers de formateo de fecha y presentación de eventos
- estado global de la pantalla principal
- renderizado condicional entre Storefront y Backstage

La parte visual se distribuye así:

- `frontend/src/App.tsx`: estructura y lógica
- `frontend/src/App.css`: estilos de layout y componentes principales
- `frontend/src/index.css`: estilos globales, tipografía, paleta y controles base

## Modelo de datos utilizado en la interfaz

### EventItem

Representa un evento del catálogo público.

Campos usados en frontend:

- `_id`
- `name`
- `description`
- `date`
- `inventory`
- `createdAt`
- `updatedAt`

Este modelo proviene del catálogo manejado por `events-service`.

### OrderItem

Representa una orden confirmada o registrada dentro de `orders-service`.

Campos usados:

- `id`
- `eventId`
- `userId`
- `quantity`
- `status`
- `createdAt`

### SessionState

Representa la sesión activa del frontend.

Campos usados:

- `accessToken`
- `userId`
- `email`
- `username`

La sesión se guarda en `localStorage` bajo la clave:

```text
eticket.frontend.session
```

## Estado principal de la aplicación

La interfaz mantiene varios grupos de estado.

### Estado de navegación

- `currentPath`

Determina si la aplicación está mostrando `Storefront` o `Backstage`.

### Estado de sesión

- `session`
- `authMode`
- `authForm`
- `backstagePassword`

Este bloque controla login, registro, desbloqueo de Backstage y persistencia local.

### Estado de catálogo y selección

- `events`
- `selectedEventId`
- `searchTerm`
- `latestCreatedEventId`

Este grupo controla qué evento se muestra como principal, el filtro textual y cuál fue el último evento creado en la demo.

### Estado de compra

- `ticketQuantity`
- `orders`

Permite crear órdenes y listar el historial del usuario autenticado.

### Estado operativo de Backstage

- `eventForm`
- `stockForm`
- `operationsMessage`
- `isOperationsPending`

Aquí viven los formularios de creación de evento y carga de stock.

### Estados de feedback y carga

- `catalogMessage`
- `authMessage`
- `checkoutMessage`
- `backstageMessage`
- `isCatalogLoading`
- `isOrdersLoading`
- `isAuthPending`
- `isCheckoutPending`
- `isBackstageAuthPending`

Se usan para mostrar estados de espera, éxito o error sin sacar al usuario de la pantalla actual.

## Rutas y superficies visibles

### Storefront (`/`)

La ruta principal está pensada para el comprador o para la demostración funcional del negocio.

Incluye:

- hero principal con branding del proyecto
- catálogo de eventos
- selección de evento activo
- formulario de login y registro
- panel de compra de tickets
- historial de órdenes del usuario
- acceso visible a `Backstage`

### Backstage (`/backstage`)

La ruta `Backstage` existe para mostrar el flujo operativo sin mezclarlo con la experiencia del comprador.

Incluye:

- acceso de administrador demo
- resumen del flujo guiado de la demo
- tarjeta con el evento actualmente seleccionado para operación
- `Step 1`: creación de evento de catálogo
- `Step 2`: inicialización de stock vendible

Esta separación mejora la claridad funcional: el comprador no ve controles operativos y el evaluador puede demostrar la arquitectura desde la misma interfaz.

## Flujo comprador

El flujo comprador sigue esta secuencia:

### 1. Carga del catálogo

Al montar la aplicación, el frontend ejecuta `GET /events`.

Con esa respuesta:

- guarda el catálogo en `events`
- selecciona un evento activo por defecto
- deja precargado `stockForm.eventId` con el primer evento disponible, si aún no había uno seleccionado

### 2. Exploración visual

El usuario puede:

- filtrar eventos por texto
- cambiar el evento seleccionado
- ver fecha, género inferido, venue inferido y arte visual generado

Parte de la estética del frontend se apoya en helpers de presentación que limpian títulos y generan posters SVG en memoria para reforzar la sensación de una plataforma de eventos real.

### 3. Registro o login

El frontend soporta dos modos:

- `register`
- `login`

En registro se ejecuta primero `POST /auth/register` y luego `POST /auth/login`.

En login se ejecuta directamente `POST /auth/login`.

Tras un login exitoso:

- se guarda el `accessToken`
- se intenta derivar `userId` desde el JWT
- se persiste la sesión en `localStorage`
- se dispara la carga de órdenes del usuario

### 4. Compra protegida

Cuando el usuario compra:

- se valida que exista evento seleccionado
- se valida que exista sesión
- se valida que el token exponga un `userId` utilizable
- se envía `POST /orders` con `eventId`, `userId` y `quantity`

Si la orden se crea correctamente:

- se agrega al estado local de órdenes
- se informa el éxito en pantalla

## Flujo Backstage

El flujo `Backstage` está diseñado como una guía secuencial de demo, no como un panel administrativo completo.

### Objetivo

Permitir demostrar, desde la interfaz, que:

- el catálogo se crea en un servicio distinto al stock real
- el acceso operativo está protegido
- después de crear un evento se puede cargar su stock real y probar la compra en Storefront

### Acceso

La ruta `Backstage` muestra una autenticación demo basada en la cuenta fija configurada por entorno.

Variables relevantes:

- `BACKSTAGE_ADMIN_EMAIL`
- `BACKSTAGE_ADMIN_PASSWORD`
- `BACKSTAGE_ADMIN_USERNAME`

En frontend también se usa:

- `VITE_BACKSTAGE_ADMIN_EMAIL`

La interfaz considera habilitado `Backstage` cuando el email de la sesión coincide con el email de administración demo configurado.

### Validación real

Aunque el frontend oculta o muestra controles, la autorización real no depende del cliente.

Los endpoints sensibles también están protegidos en el gateway mediante:

- `JwtAuthGuard`
- `BackstageAdminGuard`

Eso significa que si alguien intenta llamar los endpoints sin el JWT correcto, el backend rechaza la operación.

### Step 1: Create event

Este formulario crea un evento de catálogo usando `POST /events`.

Campos:

- `name`
- `description`
- `date`
- `inventory`

Cuando la creación es exitosa:

- se muestra el mensaje con el `Event ID`
- se marca el evento recién creado como `latestCreatedEventId`
- se actualiza `selectedEventId`
- se precarga `stockForm.eventId`
- se vuelve a consultar el catálogo con `fetchEvents()`

### Step 2: Initialize stock

Este formulario existe para mostrar la segunda mitad del dominio: el stock vendible no vive en el catálogo.

Campos:

- selector de eventos existentes
- campo manual de `Event ID`
- `initialInventory`

Características del flujo:

- permite usar el evento recién creado automáticamente
- permite seleccionar un evento viejo desde un `select`
- resalta el evento recién creado como `latest`
- mantiene visible el `Event ID` real para explicar la relación entre servicios

La operación envía `POST /orders/stock` con:

- `eventId`
- `initialInventory`

## Contratos HTTP consumidos por el frontend

### Autenticación

- `POST /auth/register`
- `POST /auth/login`

### Catálogo

- `GET /events`
- `POST /events`

### Órdenes y stock

- `GET /orders`
- `POST /orders`
- `POST /orders/stock`

## Manejo de sesión y JWT

El frontend no implementa refresco automático de token. Para el alcance de la demo, se trabaja con el `accessToken` obtenido en login.

El token se usa para:

- consultar órdenes protegidas
- crear órdenes
- crear eventos en Backstage
- inicializar stock en Backstage

Además, el frontend intenta extraer el `userId` del JWT usando varias claves posibles del payload:

- `user_id`
- `userId`
- `sub`
- `id`

Esto se hizo para tolerar pequeñas diferencias de naming entre implementaciones de autenticación.

## Manejo de errores

La función `requestJson` centraliza las solicitudes HTTP del frontend.

Su comportamiento principal es:

- agregar `Accept: application/json`
- agregar `Content-Type: application/json` cuando aplica
- agregar `Authorization: Bearer ...` cuando hay token
- interpretar respuestas JSON y texto plano
- convertir errores de backend a mensajes de UI legibles

Cuando el backend responde con una estructura JSON de error, el frontend intenta resolver mensajes desde:

- `message`
- `details`
- `error`

Esto permite mostrar feedback consistente incluso cuando la fuente del error cambia entre servicios.

## Carga inicial y efectos

La aplicación usa tres `useEffect` principales:

### 1. Carga inicial de eventos

Al montar, ejecuta `fetchEvents()`.

### 2. Persistencia y rehidratación de sesión

Cada vez que cambia `session`:

- si existe sesión, la guarda en `localStorage`
- si existe sesión, carga órdenes con `fetchOrders()`
- si no existe sesión, limpia la sesión almacenada

### 3. Sincronización con navegación del navegador

Escucha `popstate` para reaccionar cuando el usuario usa atrás o adelante.

## Decisiones de experiencia de usuario

### Separación Storefront / Backstage

Se evitó mezclar en la pantalla pública controles como:

- crear evento
- cargar stock
- mostrar credenciales o acciones operativas

La razón fue mejorar la legibilidad de la demo y mantener coherencia con las fronteras del dominio.

### Flujo secuencial de Backstage

El panel operativo se reorganizó en pasos para evitar la impresión equivocada de que crear catálogo y cargar stock eran la misma operación.

Eso ayuda a reforzar el mensaje arquitectónico del proyecto.

### Selector de eventos viejos

Se añadió la posibilidad de tomar eventos históricos desde `Step 2` porque, en una demo real, no siempre se desea trabajar solo con el último evento creado.

Esto también facilita repetir pruebas sin recrear datos cada vez.

## Variables de entorno del frontend

El frontend reconoce al menos estas variables:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_BACKSTAGE_ADMIN_EMAIL=admin@eticket.com
```

Uso esperado:

- `VITE_API_BASE_URL`: URL pública del gateway
- `VITE_BACKSTAGE_ADMIN_EMAIL`: email de la cuenta demo que desbloquea la vista operativa

## Ejecución local

### Desarrollo

```powershell
cd frontend
npm install
npm run dev
```

La aplicación normalmente queda disponible en:

```text
http://localhost:5173
```

### Build de producción

```powershell
cd frontend
npm run build
```

### Lint

```powershell
cd frontend
npm run lint
```

## Dependencias del backend para que el frontend funcione

Para una demo completa, el frontend depende de que el stack backend esté arriba desde la raíz del repositorio:

```powershell
docker compose up --build
```

Servicios relevantes para el front:

- `api-gateway`
- `auth-service`
- `events-service`
- `orders-service`

El frontend no depende directamente de `notifications-service`, pero este sí forma parte de la evidencia del flujo completo de compra.

## Guion corto de demo usando el frontend

Una demo razonable desde la UI puede seguir este orden:

1. abrir Storefront y mostrar catálogo
2. entrar a Backstage
3. desbloquear Backstage con la cuenta demo
4. crear un evento de catálogo
5. inicializar stock vendible para ese evento
6. volver a Storefront
7. iniciar sesión como usuario comprador
8. comprar tickets
9. mostrar las órdenes creadas

## Limitaciones conocidas

El frontend está listo para demo y entrega académica, pero no pretende ser un producto final de producción.

Limitaciones actuales:

- no hay refresh token automático en cliente
- no hay recuperación de sesión distribuida entre dispositivos
- no hay gestión avanzada de roles más allá del flujo demo de Backstage
- no hay integración con pagos reales
- no hay suite e2e específica del frontend
- la navegación es manual y deliberadamente simple

## Resumen arquitectónico

La función más importante del frontend no es solo "verse bien", sino traducir en una experiencia navegable las decisiones de arquitectura del backend.

En términos prácticos, el frontend demuestra que:

- el cliente entra por un único gateway
- autenticación, catálogo y órdenes pertenecen a servicios distintos
- catálogo y stock real no son la misma cosa
- el acceso operativo tiene una interfaz separada
- la compra protegida requiere identidad y token válidos

Por eso, el frontend no se documenta como una capa cosmética, sino como parte de la narrativa técnica del proyecto.