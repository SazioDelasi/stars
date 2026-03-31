from rest_framework import serializers

from academics.models import Course, ProgrammeRequirement
from registry.models import Registration, Semester


class RegistrationSerializer(serializers.ModelSerializer):
    courses = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Course.objects.all()
    )
    total_credits = serializers.SerializerMethodField()

    class Meta:
        model = Registration
        fields = [
            "id",
            "student",
            "programme",
            "session",
            "semester",
            "courses",
            "total_credits",
            "is_confirmed",
        ]
        read_only_fields = ["is_confirmed", "student"]

    def get_total_credits(self, obj):
        return sum(course.credits for course in obj.courses.all())

    def validate_courses(self, value):
        """
        Logic: Ensure the student hasn't selected zero courses.
        """
        if not value:
            raise serializers.ValidationError("You must select at least one course.")
        return value

    def validate(self, data):
        """
        Object-level validation: This is where the 'University Rules' live.
        """
        student = self.context["request"].user.student
        active_semester = Semester.objects.filter(is_current=True).first()
        if not active_semester:
            raise serializers.ValidationError("No active semester is currently set.")

        if not active_semester.is_registration_open:
            raise serializers.ValidationError(
                f"Registration for {active_semester} closed on "
                f"{active_semester.registration_deadline.strftime('%b %d, %Y')}."
            )
        if data["semester"] != active_semester.number:
            raise serializers.ValidationError(
                "You can only register for the currently active semester."
            )

        try:
            rules = ProgrammeRequirement.objects.get(
                programme=student.programme,
                level=student.level,
                semester=active_semester.number,
            )
        except ProgrammeRequirement.DoesNotExist:
            # Fallback defaults if no specific rule is set yet
            min_c, max_c = 15, 21
        else:
            min_c, max_c = rules.min_credits, rules.max_credits

        total_credits = sum(course.credits for course in data["courses"])

        if total_credits < min_c:
            raise serializers.ValidationError(
                f"Too few credits. Minimum required is {min_c}."
            )

        if total_credits > max_c:
            raise serializers.ValidationError(
                f"Too many credits. Maximum allowed is {max_c}."
            )

        return data

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Import inside to avoid circular dependency
        from academics.serializers.course import CourseSerializer

        representation["courses"] = CourseSerializer(
            instance.courses.all(), many=True
        ).data
        return representation

