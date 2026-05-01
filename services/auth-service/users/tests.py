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