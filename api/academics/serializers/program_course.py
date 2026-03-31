from rest_framework import serializers

from academics.models import Programme, ProgrammeCourse
from registry.models import AcademicSession


class BulkProgrammeCourseSerializer(serializers.Serializer):
    programme = serializers.PrimaryKeyRelatedField(queryset=Programme.objects.all())
    session = serializers.PrimaryKeyRelatedField(queryset=AcademicSession.objects.all())
    semester = serializers.IntegerField(min_value=1, max_value=2)
    level = serializers.IntegerField()
    course_type = serializers.ChoiceField(
        choices=[("CORE", "Core"), ("ELECTIVE", "Elective")]
    )

    # The list of course IDs to be mapped
    course_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True
    )

    def create(self, validated_data):
        course_ids = validated_data.pop("course_ids")
        programme_courses = []

        for c_id in course_ids:
            # Using update_or_create to prevent duplicates if clicked twice
            obj, created = ProgrammeCourse.objects.update_or_create(
                programme=validated_data["programme"],
                course_id=c_id,
                session=validated_data["session"],
                semester=validated_data["semester"],
                defaults={
                    "level": validated_data["level"],
                    "course_type": validated_data["course_type"],
                },
            )
            programme_courses.append(obj)

        return programme_courses
