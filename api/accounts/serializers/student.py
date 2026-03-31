from rest_framework import serializers
from accounts.models.student import Student
from academics.serializers.programme import ProgrammeSerializer


class StudentSerializer(serializers.ModelSerializer):
    session = serializers.ReadOnlyField(source="get_session_display")
    fee_payment = serializers.ReadOnlyField(source="get_fee_payment_display")
    status = serializers.ReadOnlyField(source="get_status_display")
    school = serializers.SerializerMethodField()
    programme = ProgrammeSerializer(many=False)

    class Meta:
        model = Student
        fields = [
            "index_number",
            "programme",
            "level",
            "school",
            "enrollment_year",
            "session",
            "fee_payment",
            "status",
            "registration_status",
        ]

    def get_school(self, obj):
        try:
            school = obj.programme.department.school.name
        except:
            school = None
        return school
