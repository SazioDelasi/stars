from rest_framework import serializers
from accounts.models import Student

class StudentSerializer(serializers.ModelSerializer):
    session = serializers.ReadOnlyField(source='get_session_display')
    fee_payment = serializers.ReadOnlyField(source='get_fee_payment_display')
    status = serializers.ReadOnlyField(source='get_status_display')

    class Meta:
        model = Student 
        fields = ["index_number", "level", "enrollment_year", "session", "fee_payment", "status"]
