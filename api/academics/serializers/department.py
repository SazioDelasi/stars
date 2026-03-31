from rest_framework import serializers
from academics.models import Department


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = "__all__"

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        if instance.hod:
            rep["hod"] = {
                "id": instance.hod.id,
                "name": instance.hod.user.full_name,
                "email": instance.hod.user.email,
            }
        if instance.school:
            dean = instance.school.dean if instance.school else None

            rep["school"] = {
                "id": instance.school.id if instance.school else None,
                "name": instance.school.name if instance.school else "Unassigned",
                "dean": {
                    "id": instance.school.dean.id if dean else None,
                    "name": (
                        instance.school.dean.user.full_name
                        if dean
                        else "No Dean Assigned"
                    ),
                    "email": (
                        instance.school.dean.user.email if dean else "No Dean Assigned"
                    ),
                },
            }
        return rep
