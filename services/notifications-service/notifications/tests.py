import json
from unittest.mock import Mock, patch

from django.test import SimpleTestCase

from notifications import consumer
from notifications.consumer import handle_order_confirmed, should_start_consumer


class NotificationConsumerTests(SimpleTestCase):
	def test_handle_order_confirmed_logs_notification(self):
		payload = {
			'orderId': 'order-1',
			'eventId': 'event-1',
			'userId': 'user-1',
			'quantity': 2,
			'status': 'confirmed',
		}

		with self.assertLogs('notifications.consumer', level='INFO') as captured_logs:
			handle_order_confirmed(payload)

		self.assertIn('Simulated notification sent for order=order-1', captured_logs.output[0])

	def test_consumer_is_disabled_during_tests(self):
		self.assertFalse(should_start_consumer())

	def test_consumer_starts_in_runserver_child_process(self):
		with patch.object(consumer.sys, 'argv', ['manage.py', 'runserver']):
			with patch.dict(consumer.os.environ, {'RUN_MAIN': 'true'}, clear=False):
				self.assertTrue(should_start_consumer())

	def test_listen_for_order_confirmed_processes_valid_message(self):
		payload = {
			'orderId': 'order-1',
			'eventId': 'event-1',
			'userId': 'user-1',
			'quantity': 2,
			'status': 'confirmed',
		}
		pubsub = Mock()
		pubsub.listen.return_value = iter([
			{'type': 'subscribe'},
			{'type': 'message', 'data': json.dumps(payload)},
		])
		client = Mock()
		client.pubsub.return_value = pubsub

		with patch('notifications.consumer.redis.Redis', return_value=client):
			with patch('notifications.consumer.handle_order_confirmed') as handle_mock:
				consumer.listen_for_order_confirmed()

		pubsub.subscribe.assert_called_once()
		handle_mock.assert_called_once_with(payload)
		pubsub.close.assert_called_once()
		client.close.assert_called_once()

	def test_listen_for_order_confirmed_ignores_malformed_json(self):
		pubsub = Mock()
		pubsub.listen.return_value = iter([
			{'type': 'message', 'data': '{invalid-json'},
		])
		client = Mock()
		client.pubsub.return_value = pubsub

		with patch('notifications.consumer.redis.Redis', return_value=client):
			with patch('notifications.consumer.handle_order_confirmed') as handle_mock:
				with self.assertLogs('notifications.consumer', level='ERROR') as captured_logs:
					consumer.listen_for_order_confirmed()

		handle_mock.assert_not_called()
		self.assertIn('Received malformed ORDER_CONFIRMED payload', captured_logs.output[0])

	def test_start_order_confirmed_consumer_starts_background_thread(self):
		thread = Mock()

		with patch('notifications.consumer.should_start_consumer', return_value=True):
			with patch('notifications.consumer.Thread', return_value=thread) as thread_class:
				with patch('notifications.consumer._listener_thread', None):
					consumer.start_order_confirmed_consumer()

		thread_class.assert_called_once_with(
			target=consumer.listen_for_order_confirmed,
			name='redis-order-confirmed-consumer',
			daemon=True,
		)
		thread.start.assert_called_once()

	def test_start_order_confirmed_consumer_skips_if_thread_is_alive(self):
		alive_thread = Mock()
		alive_thread.is_alive.return_value = True

		with patch('notifications.consumer.Thread') as thread_class:
			with patch('notifications.consumer._listener_thread', alive_thread):
				consumer.start_order_confirmed_consumer()

		thread_class.assert_not_called()
