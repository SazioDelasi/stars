from rest_framework import serializers
from academics.models import Dean
from authentication.serializer.user import UserSummarySerializer

class DeanSerializer(serializers.ModelSerializer):
    first_name = serializers.ReadOnlyField(source='user.first_name')
    last_name = serializers.ReadOnlyField(source='user.last_name')
    email = serializers.ReadOnlyField(source='user.email')
    class Meta:
        model = Dean
        exclude = ['id', 'user']