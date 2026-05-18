import json
import logging
import os
import sys
from threading import Thread

import redis
from django.conf import settings

logger = logging.getLogger(__name__)
_listener_thread = None


def handle_order_confirmed(payload: dict) -> None:
    logger.info(
        'Simulated notification sent for order=%s user=%s event=%s quantity=%s status=%s',
        payload.get('orderId'),
        payload.get('userId'),
        payload.get('eventId'),
        payload.get('quantity'),
        payload.get('status'),
    )


def listen_for_order_confirmed() -> None:
    client = redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        decode_responses=True,
    )
    pubsub = client.pubsub(ignore_subscribe_messages=True)

    try:
        pubsub.subscribe(settings.REDIS_ORDER_CONFIRMED_CHANNEL)
        logger.info(
            'Subscribed to Redis channel %s',
            settings.REDIS_ORDER_CONFIRMED_CHANNEL,
        )

        for message in pubsub.listen():
            if message.get('type') != 'message':
                continue

            try:
                payload = json.loads(message.get('data', '{}'))
            except json.JSONDecodeError:
                logger.exception('Received malformed ORDER_CONFIRMED payload')
                continue

            handle_order_confirmed(payload)
    except redis.RedisError:
        logger.exception('Redis ORDER_CONFIRMED consumer stopped unexpectedly')
    finally:
        pubsub.close()
        client.close()


def should_start_consumer() -> bool:
    if os.environ.get('DISABLE_REDIS_SUBSCRIBER') == 'true':
        return False

    management_commands = {'test', 'makemigrations', 'migrate', 'collectstatic', 'shell'}
    if any(command in sys.argv for command in management_commands):
        return False

    if 'runserver' in sys.argv and os.environ.get('RUN_MAIN') != 'true':
        return False

    return True


def start_order_confirmed_consumer() -> None:
    global _listener_thread

    if _listener_thread and _listener_thread.is_alive():
        return

    if not should_start_consumer():
        return

    _listener_thread = Thread(
        target=listen_for_order_confirmed,
        name='redis-order-confirmed-consumer',
        daemon=True,
    )
    _listener_thread.start()