Setup Events MS (NestJS):

- [ ] Proyecto inicializado. - [ ] Conexión a MongoDB funcionando.

CRUD y Catálogo de Eventos:

- [ ] Endpoints para crear y listar eventos.

- [ ] Gestión de inventario inicial de entradas disponible.

- [ ] Uso del patrón *Repository* (opcional pero recomendado).

Setup Reservations MS (NestJS):

- [ ] Proyecto inicializado.

- [ ] Conexión a PostgreSQL (esquema de órdenes) funcionando.

Lógica de Reserva y Bloqueo:

- [ ] Implementación de transacción de BD (Pessimistic u Optimistic Locking) en PostgreSQL.

- [ ] Resta de inventario y creación de la orden.

- [ ] Validación estricta para evitar inventario negativo.

Tests de Concurrencia:

- [ ] Test que simule al menos 2 peticiones concurrentes comprando la última entrada.

- [ ] Aserción de que solo 1 compra es exitosa y la otra falla o es rechazada.

Setup Notifications MS (Django):

- [ ] Proyecto creado.

- [ ] Escucha de eventos configurada vía Redis (Pub/Sub).

Emisión de Eventos de Compra:

- [ ] Reservations MS publica el evento \ORDER_CONFIRMED` en Redis.

 

[ ] Notifications MS lo consume y simula envío de correo/alerta (con logs).`

Comunicación Gateway ↔ Core:

- [ ] API Gateway expone rutas de Eventos (públicas) y Reservas (protegidas con JWT).

Tests Unitarios (Events & Res):

- [ ] Pruebas en Jest para ambos microservicios.

- [ ] Mocks para llamadas entre servicios y BD.

- [ ] Cobertura >70% comprobada.

Colección Insomnia: Core:

- [ ] Flujo de búsqueda de evento, reserva de entrada y validación añadido a la colección.
