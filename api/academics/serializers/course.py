from rest_framework import serializers
from academics.models import Course, ProgrammeCourse


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = "__all__"


class AvailableCourseSerializer(serializers.ModelSerializer):
    credits = serializers.ReadOnlyField(source="course.credits")

    class Meta:
        model = ProgrammeCourse
        fields = ["id", "course", "credits", "course_type", "level"]
