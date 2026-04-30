---
title: Diagrama de Arquitectura - E-Ticket
---

```mermaid
graph TD
  A[Cliente/Frontend] -->|HTTP/REST| B(API Gateway - NestJS)
  B -->|REST| C(Auth Service - Django)
  B -->|REST| D(Events Service - NestJS)
  B -->|REST| E(Orders Service - NestJS)
  B -->|REST| F(Notifications Service - Django)
  C -->|PostgreSQL| G[(PostgreSQL)]
  D -->|MongoDB| H[(MongoDB)]
  E -->|MongoDB| H
  B -->|Redis/NATS| I[(Redis/NATS)]
  C -->|Redis| I
  D -->|Redis| I
  E -->|Redis| I
  F -->|Redis| I
  F -->|Email/SMS| J[(Proveedor externo)]
```

**Descripción:**
- El cliente se comunica con el API Gateway.
- El Gateway enruta peticiones a los microservicios.
- Cada microservicio usa su propia base de datos.
- Redis/NATS se usa para cache, colas y eventos.
- Notificaciones puede interactuar con servicios externos (email/SMS).
