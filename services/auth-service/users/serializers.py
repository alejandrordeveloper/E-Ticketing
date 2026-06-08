from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.utils.html import strip_tags
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User


def sanitize_text_input(value):
    if not isinstance(value, str):
        return value

    return strip_tags(value).strip()


def sanitize_email_input(value):
    if not isinstance(value, str):
        return value

    return sanitize_text_input(value).lower()

class UserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        min_length=3,
        max_length=150,
        validators=[UniqueValidator(queryset=User.objects.all())],
    )
    email = serializers.EmailField(validators=[UniqueValidator(queryset=User.objects.all())])
    password = serializers.CharField(write_only=True, min_length=8, trim_whitespace=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']

    def to_internal_value(self, data):
        mutable_data = data.copy()
        unexpected_fields = set(mutable_data.keys()) - set(self.fields.keys())

        if unexpected_fields:
            raise serializers.ValidationError(
                {field_name: ['This field is not allowed.'] for field_name in unexpected_fields}
            )

        if 'username' in mutable_data:
            mutable_data['username'] = sanitize_text_input(mutable_data.get('username'))

        if 'email' in mutable_data:
            mutable_data['email'] = sanitize_email_input(mutable_data.get('email'))

        return super().to_internal_value(mutable_data)

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user


class UserLoginSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['username'] = user.username
        token['is_staff'] = user.is_staff
        return token

    def validate(self, attrs):
        sanitized_attrs = attrs.copy()
        sanitized_attrs[self.username_field] = sanitize_email_input(
            sanitized_attrs.get(self.username_field)
        )
        return super().validate(sanitized_attrs)