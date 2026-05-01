from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

# Create your tests here.

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
            "email": "testuser01@email.com",
            "password": "testpassword123"
        }
        response = self.client.post('/login/', login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)  # O el campo que devuelva tu JWT

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
        self.assertIn('email', response.data)

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
        self.assertIn('detail', response.data)

class UserLoginNonexistentEmailTest(APITestCase):
    def test_login_nonexistent_email(self):
        login_data = {
            "email": "noexiste@email.com",
            "password": "cualquierpassword"
        }
        response = self.client.post('/login/', login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('detail', response.data)

class UserRegistrationMissingFieldTest(APITestCase):
    def test_register_missing_email(self):
        data = {
            "username": "testuser04",
            # Falta el campo email
            "password": "testpassword123"
        }
        response = self.client.post('/register/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_register_missing_password(self):
        data = {
            "username": "testuser05",
            "email": "testuser05@email.com"
            # Falta el campo password
        }
        response = self.client.post('/register/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

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