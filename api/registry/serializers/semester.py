from rest_framework import serializers

from registry.models import AcademicSession, Semester


class AcademicSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicSession
        fields = "__all__"


class SemesterSerializer(serializers.ModelSerializer):
    semester_name = serializers.CharField(source="get_number_display", read_only=True)
    session_year = serializers.ReadOnlyField(source="session.year")

    class Meta:
        model = Semester
        fields = "__all__"
