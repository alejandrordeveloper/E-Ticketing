# Auth Service

Este microservicio implementa autenticación para E-ticket usando Django, Django REST Framework y SimpleJWT.

## Responsabilidad actual

En el estado final de Sprint 3, este servicio se encarga de:

- registrar usuarios
- autenticar por `email`
- emitir `access` y `refresh` tokens
- refrescar tokens
- validar y sanear inputs de autenticación
- responder errores con contrato JSON consistente
- exponer documentación Swagger

## Stack

- Django
- Django REST Framework
- PostgreSQL
- SimpleJWT
- Argon2
- drf-yasg
- python-dotenv

## Variables de entorno

### Docker

Archivo:

```text
services/auth-service/.env
```

Configuración esperada:

```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
DATABASE_NAME=auth_db
DATABASE_USER=postgres
DATABASE_PASSWORD=your-db-password
DATABASE_HOST=postgres-db
DATABASE_PORT=5432
```

### Local

Archivo:

```text
services/auth-service/.env.local
```

Configuración usada en desarrollo local:

```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
DATABASE_NAME=auth_db
DATABASE_USER=postgres
DATABASE_PASSWORD=your-db-password
DATABASE_HOST=localhost
DATABASE_PORT=5433
```

## Ejecución local

```powershell
cd services/auth-service
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

## Endpoints

- `POST /register/`
- `POST /login/`
- `POST /token/`
- `GET /api/schema/`
- `GET /api/docs/`

## Seguridad y validación

- autenticación por `email`
- contraseñas con Argon2
- access token de `15 minutos`
- refresh token de `3 días`
- serializers estrictos con rechazo de campos desconocidos
- normalización de `email` y saneamiento básico de texto

## Manejo de errores

El servicio usa:

- exception handler de DRF para respuestas normalizadas
- middleware para errores no controlados
- logging estructurado JSON

## Pruebas

```powershell
python manage.py test users
coverage run --source='.' manage.py test users
coverage report
```

Cobertura validada en Sprint 3:

- `93%`