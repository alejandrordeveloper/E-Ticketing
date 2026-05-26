from django.test import override_settings
from django.urls import path
from rest_framework.test import APITestCase
from rest_framework import status
from .models import User


def boom_view(request):
    raise RuntimeError('boom')


urlpatterns = [
    path('boom/', boom_view),
]

class UserRegistrationTest(APITestCase):
    def test_register_user(self):
        url = '/register/'  # Asegúrate que tu urlpattern tiene el name='register'
        data = {
            "username": "testuser0",
            "email": "testuser0@email.com",
            "password": "testpassword123"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)

class UserLoginTest(APITestCase):
    def setUp(self):
        self.user = {
            "username": "testuser01",
            "email": "testuser01@email.com",
            "password": "testpassword123"
        }
        # Registrar el usuario
        self.client.post('/register/', self.user, format='json')

    def test_login_user(self):
        login_data = {
            "email": "  TESTUSER01@EMAIL.COM  ",
            "password": "testpassword123"
        }
        response = self.client.post('/login/', login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)  # O el campo que devuelva tu JWT

class UserRegistrationSanitizationTest(APITestCase):
    def test_register_sanitizes_username_and_email(self):
        response = self.client.post(
            '/register/',
            {
                'username': '  <script>alert(1)</script>testuser07  ',
                'email': '  TESTUSER07@EMAIL.COM  ',
                'password': 'testpassword123',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_user = User.objects.get(email='testuser07@email.com')
        self.assertEqual(created_user.username, 'alert(1)testuser07')


class UserRegistrationStrictFieldsTest(APITestCase):
    def test_register_rejects_unknown_field(self):
        response = self.client.post(
            '/register/',
            {
                'username': 'testuser08',
                'email': 'testuser08@email.com',
                'password': 'testpassword123',
                'role': 'admin',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['message'], 'Validation failed')
        self.assertEqual(response.data['service'], 'auth-service')
        self.assertIn('role', response.data['details'])

class UserRegistrationDuplicateEmailTest(APITestCase):
    def setUp(self):
        self.user = {
            "username": "testuser02",
            "email": "testuser02@email.com",
            "password": "testpassword123"
        }
        self.client.post('/register/', self.user, format='json')

    def test_register_duplicate_email(self):
        response = self.client.post('/register/', self.user, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['message'], 'Validation failed')
        self.assertEqual(response.data['service'], 'auth-service')
        self.assertEqual(response.data['path'], '/register/')
        self.assertIn('details', response.data)
        self.assertIn('email', response.data['details'])

class UserLoginWrongPasswordTest(APITestCase):
    def setUp(self):
        self.user = {
            "username": "testuser03",
            "email": "testuser03@email.com",
            "password": "testpassword123"
        }
        self.client.post('/register/', self.user, format='json')

    def test_login_wrong_password(self):
        login_data = {
            "email": "testuser03@email.com",
            "password": "wrongpassword"
        }
        response = self.client.post('/login/', login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['statusCode'], 401)
        self.assertEqual(response.data['error'], 'Unauthorized')
        self.assertEqual(response.data['service'], 'auth-service')
        self.assertEqual(response.data['path'], '/login/')
        self.assertIn('message', response.data)

class UserLoginNonexistentEmailTest(APITestCase):
    def test_login_nonexistent_email(self):
        login_data = {
            "email": "noexiste@email.com",
            "password": "cualquierpassword"
        }
        response = self.client.post('/login/', login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['statusCode'], 401)
        self.assertEqual(response.data['error'], 'Unauthorized')
        self.assertEqual(response.data['service'], 'auth-service')
        self.assertEqual(response.data['path'], '/login/')
        self.assertIn('message', response.data)

class UserRegistrationMissingFieldTest(APITestCase):
    def test_register_missing_email(self):
        data = {
            "username": "testuser04",
            # Falta el campo email
            "password": "testpassword123"
        }
        response = self.client.post('/register/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['message'], 'Validation failed')
        self.assertEqual(response.data['service'], 'auth-service')
        self.assertIn('email', response.data['details'])

    def test_register_missing_password(self):
        data = {
            "username": "testuser05",
            "email": "testuser05@email.com"
            # Falta el campo password
        }
        response = self.client.post('/register/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['message'], 'Validation failed')
        self.assertEqual(response.data['service'], 'auth-service')
        self.assertIn('password', response.data['details'])

class TokenRefreshTest(APITestCase):
    def setUp(self):
        self.user = {
            "username": "testuser06",
            "email": "testuser06@email.com",
            "password": "testpassword123"
        }
        self.client.post('/register/', self.user, format='json')
        login_data = {
            "email": "testuser06@email.com",
            "password": "testpassword123"
        }
        response = self.client.post('/login/', login_data, format='json')
        self.refresh_token = response.data.get('refresh')

    def test_refresh_token(self):
        data = {"refresh": self.refresh_token}
        response = self.client.post('/token/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)


@override_settings(ROOT_URLCONF=__name__)
class JsonExceptionMiddlewareTest(APITestCase):
    def test_unhandled_exception_returns_standardized_json(self):
        self.client.raise_request_exception = False
        response = self.client.get('/boom/')
        payload = response.json()

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(payload['statusCode'], 500)
        self.assertEqual(payload['error'], 'Internal Server Error')
        self.assertEqual(payload['message'], 'Unexpected error')
        self.assertEqual(payload['path'], '/boom/')
        self.assertEqual(payload['service'], 'auth-service')
        self.assertIn('timestamp', payload)