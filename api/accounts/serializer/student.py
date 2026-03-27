from rest_framework import serializers
from accounts.models.student import Student
from academics.models import School

class StudentSerializer(serializers.ModelSerializer):
    session = serializers.ReadOnlyField(source='get_session_display')
    fee_payment = serializers.ReadOnlyField(source='get_fee_payment_display')
    status = serializers.ReadOnlyField(source='get_status_display')
    school = serializers.SerializerMethodField()

    class Meta:
        model = Student 
        fields = ["index_number","programme", "level", "enrollment_year", "session", "fee_payment", "status"]
    
    def get_school(self, obj):
        school = obj.programme.department.school
        return school