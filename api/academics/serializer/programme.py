from rest_framework import serializers
from academics.models import Programme
from academics.serializer.department import DepartmentSerializer

class ProgrammeSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(many=False)
    class Meta:
        model = Programme
        fields = "__all__"

