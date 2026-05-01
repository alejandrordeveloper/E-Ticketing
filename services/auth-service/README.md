# Auth Service

Este microservicio implementa la autenticación del proyecto E-ticket usando Django, Django REST Framework y SimpleJWT.

## Responsabilidad actual

En Sprint 1 este servicio quedó encargado de:

- registrar usuarios
- autenticar usuarios
- emitir access token y refresh token
- refrescar access tokens

## Stack

- Django
- Django REST Framework
- PostgreSQL
- SimpleJWT
- Argon2
- python-dotenv

## Dependencias instaladas

Las dependencias declaradas en `requirements.txt` son:

- `Django>=4.0`
- `djangorestframework`
- `psycopg2-binary`
- `python-dotenv`
- `djangorestframework-simplejwt`
- `argon2-cffi`

## Modelo de usuario

Se usa un usuario personalizado definido en `users/models.py`.

Características principales:

- `email` único
- autenticación por `email`
- `username` obligatorio como campo adicional

Configuración clave:

```python
USERNAME_FIELD = 'email'
REQUIRED_FIELDS = ['username']
```

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

`config/settings.py` intenta cargar `.env.local` y si no existe usa `.env`.

## Instalación

Si trabajas localmente:

```powershell
cd services/auth-service
pip install -r requirements.txt
```

Ese comando instala tanto las dependencias de ejecución del servicio como las herramientas de desarrollo usadas en el Sprint 1, incluida la generación de cobertura con `coverage`.

## Migraciones

```powershell
python manage.py migrate
```

## Ejecución local

```powershell
python manage.py runserver 8000
```

## Ejecución con Docker

Este servicio también se construye con el Dockerfile del proyecto y se levanta desde la raíz con:

```powershell
docker compose up
```

## Endpoints

### POST /register/

Registra un usuario nuevo.

Body:

```json
{
  "username": "usuario1",
  "email": "usuario1@email.com",
  "password": "Password123"
}
```

### POST /login/

Autentica con `email` y `password`.

Body:

```json
{
  "email": "usuario1@email.com",
  "password": "Password123"
}
```

Respuesta esperada:

```json
{
  "refresh": "<refresh_token>",
  "access": "<access_token>"
}
```

### POST /token/

Refresca el access token.

Body:

```json
{
  "refresh": "<refresh_token>"
}
```

## Seguridad configurada

- Hash de contraseñas con Argon2 como algoritmo principal.
- Autenticación por JWT en DRF.
- Tokens Bearer.
- Access token de 15 minutos.
- Refresh token de 3 días.

## Tests

Los tests actuales están en `users/tests.py`.

Casos cubiertos:

- registro exitoso
- login exitoso
- email duplicado
- contraseña incorrecta
- email inexistente
- registro con campos faltantes
- refresh token exitoso

Ejecutar tests:

```powershell
python manage.py test users
```

## Cobertura

Si todavía no instalaste dependencias, primero ejecuta:

```powershell
pip install -r requirements.txt
```

Luego puedes medir cobertura con:

```powershell
coverage run manage.py test users
coverage report -m
coverage html
```

El reporte visual se genera en `htmlcov/index.html`.