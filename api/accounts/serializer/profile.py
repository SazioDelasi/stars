from rest_framework import serializers
from accounts.serializer.student import StudentSerializer
from accounts.models import Student
from authentication.models import User


class ProfileSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "role", "profile"]

    def get_profile(self, obj):
        if obj.role == User.Role.STUDENT:
            try:
                return StudentSerializer(obj.student).data
            except Student.DoesNotExist:
                return None
        # Add other roles here later:
        # elif obj.role == 'lecturer': ...
        return None
