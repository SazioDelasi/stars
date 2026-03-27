from rest_framework import serializers
from academics.models import School, Department
from accounts.serializer.dean import DeanSerializer
from accounts.models.dean import Dean


class SchoolSerializer(serializers.ModelSerializer):
    dean = serializers.PrimaryKeyRelatedField(queryset=Dean.objects.all())
    number_of_departments = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = School
        fields = "__all__"

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.dean:
            representation["dean"] = {
                "id": instance.dean,
                "name": instance.dean.user.full_name,
                "email": instance.dean.user.email,
            }
        return representation

    def get_number_of_departments(self, obj):
        count = Department.objects.filter(school=obj).count()
        return count
