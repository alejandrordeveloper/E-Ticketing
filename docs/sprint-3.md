# Sprint 3: Calidad, Documentación y Demo

## Objetivo del sprint

El objetivo de este sprint fue cerrar el proyecto con estándares mínimos de calidad técnica, documentación navegable y evidencia suficiente para exponer el sistema de punta a punta.

## Alcance implementado

Durante este sprint se completaron cuatro líneas de trabajo:

- manejo global de errores
- validación de inputs y saneamiento básico
- documentación OpenAPI/Swagger
- revisión y aumento de cobertura automática

## Manejo global de errores

Se unificó el contrato de error en los servicios HTTP para que cliente, pruebas y documentación consuman la misma estructura.

### Contrato aplicado

Las respuestas de error quedaron normalizadas con:

- `statusCode`
- `error`
- `message`
- `timestamp`
- `path`
- `service`
- `details` cuando aplica

### Servicios cubiertos

- `api-gateway`
- `events-service`
- `orders-service`
- `auth-service`

En Nest se resolvió con filtros globales de excepciones. En Django se resolvió con un exception handler de DRF y middleware para errores no controlados.

## Validación de inputs y saneamiento

Se reforzó la validación de entrada en las rutas sensibles del proyecto.

### Cambios aplicados

- DTOs tipados para autenticación, eventos, órdenes y stock en el Gateway
- `ValidationPipe` con normalización y whitelist en servicios Nest
- serializers más estrictos en `auth-service`
- rechazo de campos desconocidos en registro
- normalización de `email` y saneamiento básico de texto para reducir entrada basura o HTML embebido

## Swagger y documentación viva

Se agregó documentación OpenAPI en los servicios expuestos por HTTP para facilitar demo, validación manual y revisión técnica.

### Endpoints de documentación

- `api-gateway`: `http://localhost:3000/api/docs`
- `events-service`: `http://localhost:3002/api/docs`
- `orders-service`: `http://localhost:3001/api/docs`
- `auth-service`: `http://localhost:8000/api/docs/`

## Cobertura y calidad automática

Se ejecutó cobertura por servicio y se añadieron tests dirigidos en los puntos con menor ejecución.

### Resultado final

- `api-gateway`: `92.17%`
- `events-service`: `87.21%`
- `orders-service`: `87.44%`
- `auth-service`: `93%`
- `notifications-service`: `91%`

El objetivo de `>70%` quedó cumplido en los cinco servicios.

## Flujo de demo recomendado

Para exponer el sistema de forma breve y completa, el recorrido recomendado es:

1. Registrar usuario o iniciar sesión desde `api-gateway`.
2. Mostrar el token JWT obtenido.
3. Crear un evento.
4. Consultar el catálogo de eventos.
5. Inicializar stock del evento.
6. Crear una orden autenticada.
7. Consultar las órdenes generadas.
8. Revisar logs de `notifications-service` para confirmar recepción de `ORDER_CONFIRMED`.
9. Mostrar Swagger en los cuatro servicios HTTP.

## Documentos relacionados

- [diagrama-arquitectura.md](./diagrama-arquitectura.md)
- [diagrama-er.md](./diagrama-er.md)
- [diagrama-secuencia-compra.md](./diagrama-secuencia-compra.md)
- [sprint-1.md](./sprint-1.md)
- [sprint-2.md](./sprint-2.md)