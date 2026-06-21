from rest_framework import serializers
from .models import Department, Programme, Student


class DepartmentSerializer(serializers.ModelSerializer):
    student_count = serializers.SerializerMethodField()
    active_count  = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = '__all__'

    def get_student_count(self, obj):
        return obj.students.count()

    def get_active_count(self, obj):
        return obj.students.filter(status='active').count()


class ProgrammeSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    student_count   = serializers.SerializerMethodField()

    class Meta:
        model = Programme
        fields = '__all__'  # includes min_graduation_credits

    def get_student_count(self, obj):
        return obj.students.count()


class StudentListSerializer(serializers.ModelSerializer):
    full_name        = serializers.CharField(source='user.get_full_name', read_only=True)
    email            = serializers.CharField(source='user.email', read_only=True)
    department_name  = serializers.CharField(source='department.name', read_only=True)
    programme_name   = serializers.CharField(source='programme.name', read_only=True)
    cumulative_gpa   = serializers.FloatField(read_only=True)
    academic_standing = serializers.CharField(read_only=True)
    trail_count      = serializers.IntegerField(read_only=True)
    in_academic_danger = serializers.BooleanField(read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'index_number', 'reference_number', 'full_name', 'email',
            'department', 'department_name', 'programme', 'programme_name',
            'year_of_admission', 'current_year', 'current_semester',
            'status', 'cumulative_gpa', 'academic_standing',
            'trail_count', 'in_academic_danger', 'phone',
        ]


class StudentDetailSerializer(serializers.ModelSerializer):
    full_name         = serializers.CharField(source='user.get_full_name', read_only=True)
    email             = serializers.CharField(source='user.email', read_only=True)
    department_name   = serializers.CharField(source='department.name', read_only=True)
    programme_name    = serializers.CharField(source='programme.name', read_only=True)
    faculty           = serializers.CharField(source='department.faculty', read_only=True)
    cumulative_gpa    = serializers.FloatField(read_only=True)
    academic_standing = serializers.CharField(read_only=True)
    trail_count       = serializers.IntegerField(read_only=True)
    in_academic_danger = serializers.BooleanField(read_only=True)

    class Meta:
        model = Student
        fields = '__all__'
