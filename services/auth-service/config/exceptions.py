from __future__ import annotations

from datetime import datetime, timezone
from http import HTTPStatus

from rest_framework.response import Response
from rest_framework.views import exception_handler


SERVICE_NAME = 'auth-service'


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        return None

    request = context.get('request')
    path = request.path if request else ''
    normalized_error = _normalize_error_response(response.status_code, response.data)

    payload = {
        'statusCode': response.status_code,
        'error': normalized_error['error'],
        'message': normalized_error['message'],
        'timestamp': _timestamp(),
        'path': path,
        'service': SERVICE_NAME,
    }

    if normalized_error['details'] is not None:
        payload['details'] = normalized_error['details']

    response.data = payload
    return response


def _normalize_error_response(status_code, data):
    if isinstance(data, list):
        return {
            'error': _status_label(status_code),
            'message': 'Validation failed',
            'details': data,
        }

    if isinstance(data, dict):
        if 'detail' in data:
            return {
                'error': _status_label(status_code),
                'message': str(data['detail']),
                'details': None,
            }

        if 'message' in data and isinstance(data['message'], str):
            return {
                'error': str(data.get('error', _status_label(status_code))),
                'message': data['message'],
                'details': data.get('details'),
            }

        return {
            'error': str(data.get('error', _status_label(status_code))),
            'message': 'Validation failed',
            'details': data,
        }

    return {
        'error': _status_label(status_code),
        'message': str(data),
        'details': None,
    }


def _status_label(status_code):
    try:
        return HTTPStatus(status_code).phrase
    except ValueError:
        return 'Error'


def _timestamp():
    return datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')