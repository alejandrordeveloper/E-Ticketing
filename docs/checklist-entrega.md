# Checklist de Entrega

## Estado general

Checklist propuesto para revisar el entregable final de E-ticket antes de exposición o envío.

## Código y arquitectura

- [x] API Gateway operativo
- [x] Auth Service operativo
- [x] Events Service operativo
- [x] Orders Service operativo
- [x] Notifications Service operativo
- [x] Separación de responsabilidades entre catálogo, órdenes y notificaciones

## Calidad técnica

- [x] Manejo global de errores documentado e implementado
- [x] Validación de inputs aplicada en rutas sensibles
- [x] Saneamiento básico en autenticación
- [x] Logging estructurado implementado
- [x] Cobertura superior a `70%` en todos los servicios

## Documentación

- [x] README principal actualizado a Sprint 3
- [x] Documento de Sprint 1
- [x] Documento de Sprint 2
- [x] Documento de Sprint 3
- [x] Diagrama de arquitectura
- [x] Diagrama entidad-relación
- [x] Diagrama de secuencia de compra
- [x] Guion de demo

## APIs y pruebas manuales

- [x] Swagger en `api-gateway`
- [x] Swagger en `events-service`
- [x] Swagger en `orders-service`
- [x] Swagger en `auth-service`
- [x] Colecciones de Insomnia presentes en el repositorio

## Validación funcional sugerida

- [x] Registro de usuario
- [x] Login de usuario
- [x] Creación de evento
- [x] Consulta de eventos
- [x] Inicialización de stock
- [x] Creación de orden
- [x] Consulta de órdenes
- [x] Consumo de `ORDER_CONFIRMED` en notificaciones

## Pendientes externos

Estos puntos dependen del formato final de entrega o del entorno de despliegue:

- [ ] URL pública o VPS, si la entrega la exige
- [ ] Video de demo, si la entrega la exige
- [ ] Tablero Trello compartido, si la entrega lo exige
- [ ] Exportación final de Insomnia adjunta al paquete de entrega, si se pide por separado