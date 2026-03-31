from rest_framework import serializers
from academics.models import CourseAssignment

class CourseAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseAssignment
        fields = "__all__"