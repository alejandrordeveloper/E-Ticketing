# Insomnia

Esta carpeta contiene las exportaciones de Insomnia usadas para validar manualmente los endpoints del Sprint 1.

## Archivos incluidos

- `Insomnia_Django`
- `Insomnia_Nestjs`

## Qué cubren

Las colecciones se usaron para probar:

- registro de usuario
- login
- flujo directo contra Django
- flujo a través del API Gateway

## Cómo importarlas

1. Abre Insomnia.
2. Selecciona la opción de importar colección.
3. Elige el archivo exportado desde esta carpeta.
4. Importa en formato Insomnia.

## Variables sugeridas

Para trabajar más cómodo conviene definir al menos:

```text
base_url=http://localhost:3000
auth_url=http://localhost:8000
token=<jwt>
```

## Endpoints probados en Sprint 1

### Gateway

- `POST /auth/register`
- `POST /auth/login`

### Auth directo

- `POST /register/`
- `POST /login/`
- `POST /token/`