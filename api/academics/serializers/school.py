from rest_framework import serializers
from academics.models import School, Department
from accounts.serializers.dean import DeanSerializer
from accounts.models.dean import Dean


class SchoolSerializer(serializers.ModelSerializer):
    number_of_departments = serializers.IntegerField(read_only=True)

    class Meta:
        model = School
        fields = "__all__"

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        if instance.dean:
            rep["dean"] = {
                "id": instance.dean.id,
                "name": instance.dean.user.full_name,
                "email": instance.dean.user.email,
            }
        return rep
