from rest_framework import serializers
from authentication.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "role",
            "username",
            "phone",
            "first_name",
            "last_name",
            "date_joined",
            "email",
            "is_active",
        ]


class UserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["first_name", "last_name", "email"]


class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "role",
            "username",
            "phone",
            "first_name",
            "last_name",
            "date_joined",
            "email",
            "is_active",
        ]
