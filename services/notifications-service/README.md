# Notifications Service

Este microservicio consume eventos `ORDER_CONFIRMED` desde Redis y simula el envío de notificaciones usando Django.

## Responsabilidad actual

En el estado final de Sprint 3, este servicio se encarga de:

- suscribirse al canal Redis configurado para compras confirmadas
- interpretar el payload de `ORDER_CONFIRMED`
- registrar un log que simula el envío de la notificación
- evitar levantar el consumidor durante tests y comandos administrativos

## Variables de entorno

Configuración relevante en `config/settings.py`:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_ORDER_CONFIRMED_CHANNEL=ORDER_CONFIRMED
```

## Ejecución local

```powershell
cd services/notifications-service
pip install -r requirements.txt
python manage.py runserver 8001
```

## Comportamiento

Al iniciar el servicio en un contexto normal de ejecución:

- `apps.py` dispara el arranque del consumidor
- `consumer.py` se suscribe al canal Redis
- cada evento válido genera un log de notificación simulada

Durante tests, migraciones o comandos como `shell`, el consumidor no se inicia.

## Pruebas

```powershell
python manage.py test notifications
coverage run --source='.' manage.py test notifications
coverage report
```

Cobertura validada en Sprint 3:

- `91%`