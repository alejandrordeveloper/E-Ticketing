from __future__ import annotations

import logging
from datetime import datetime, timezone

from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin


logger = logging.getLogger('django')


class JsonExceptionMiddleware(MiddlewareMixin):
    service_name = 'auth-service'

    def process_exception(self, request, exception):
        logger.exception('Unhandled exception while processing request', extra={'path': request.path})
        return JsonResponse(
            {
                'statusCode': 500,
                'error': 'Internal Server Error',
                'message': 'Unexpected error',
                'timestamp': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
                'path': request.path,
                'service': self.service_name,
            },
            status=500,
        )