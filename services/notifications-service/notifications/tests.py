from django.test import SimpleTestCase

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
