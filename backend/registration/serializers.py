from rest_framework import serializers
from .models import CourseRegistration, RegisteredCourse
from results.models import Lecturer, CourseOffering


class LecturerSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Lecturer
        fields = ['id', 'full_name', 'title', 'first_name', 'last_name',
                  'email', 'department', 'is_active']


class CourseOfferingSerializer(serializers.ModelSerializer):
    lecturer_name      = serializers.CharField(source='lecturer.full_name',  read_only=True)
    lecturer_email     = serializers.CharField(source='lecturer.email',       read_only=True)
    course_code        = serializers.CharField(source='course.code',          read_only=True)
    course_title       = serializers.CharField(source='course.title',         read_only=True)
    credit_hours       = serializers.IntegerField(source='course.credit_hours', read_only=True)
    is_core            = serializers.BooleanField(source='course.is_core',    read_only=True)
    academic_year_label= serializers.CharField(source='academic_year.label',  read_only=True)
    enrolled_count     = serializers.IntegerField(read_only=True)

    class Meta:
        model  = CourseOffering
        fields = ['id', 'course', 'course_code', 'course_title', 'credit_hours',
                  'is_core', 'academic_year', 'academic_year_label', 'semester',
                  'lecturer', 'lecturer_name', 'lecturer_email',
                  'max_students', 'enrolled_count', 'notes']


class RegisteredCourseSerializer(serializers.ModelSerializer):
    course_code   = serializers.CharField(source='course.code',          read_only=True)
    course_title  = serializers.CharField(source='course.title',         read_only=True)
    credit_hours  = serializers.IntegerField(source='course.credit_hours', read_only=True)
    course_is_core= serializers.BooleanField(source='course.is_core',    read_only=True)
    # Lecturer info via CourseOffering — resolved at serializer level
    lecturer_name = serializers.SerializerMethodField()
    lecturer_email= serializers.SerializerMethodField()

    class Meta:
        model  = RegisteredCourse
        fields = ['id', 'registration', 'course', 'course_code', 'course_title',
                  'credit_hours', 'course_is_core', 'is_core',
                  'lecturer_name', 'lecturer_email', 'added_at']
        read_only_fields = ['added_at', 'is_core']

    def _offering(self, obj):
        reg = obj.registration
        try:
            return CourseOffering.objects.select_related('lecturer').get(
                course=obj.course,
                academic_year=reg.academic_year,
                semester=reg.semester,
            )
        except CourseOffering.DoesNotExist:
            return None

    def get_lecturer_name(self, obj):
        o = self._offering(obj)
        return o.lecturer.full_name if o and o.lecturer else 'TBA'

    def get_lecturer_email(self, obj):
        o = self._offering(obj)
        return o.lecturer.email if o and o.lecturer else ''


class CourseRegistrationSerializer(serializers.ModelSerializer):
    registered_courses  = RegisteredCourseSerializer(many=True, read_only=True)
    total_credits       = serializers.IntegerField(read_only=True)
    core_credits        = serializers.IntegerField(read_only=True)
    elective_credits    = serializers.IntegerField(read_only=True)
    student_name        = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_index       = serializers.CharField(source='student.index_number',       read_only=True)
    academic_year_label = serializers.CharField(source='academic_year.label',        read_only=True)
    approved_by_name    = serializers.CharField(source='approved_by.get_full_name',  read_only=True)

    class Meta:
        model  = CourseRegistration
        fields = '__all__'
        read_only_fields = ['student', 'submitted_at', 'approved_by', 'approved_at',
                            'created_at', 'updated_at']


class CourseRegistrationListSerializer(serializers.ModelSerializer):
    student_name        = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_index       = serializers.CharField(source='student.index_number',       read_only=True)
    student_dept        = serializers.CharField(source='student.department.name',    read_only=True)
    academic_year_label = serializers.CharField(source='academic_year.label',        read_only=True)
    total_credits       = serializers.IntegerField(read_only=True)
    course_count        = serializers.IntegerField(source='registered_courses.count', read_only=True)

    class Meta:
        model  = CourseRegistration
        fields = ['id', 'student', 'student_name', 'student_index', 'student_dept',
                  'academic_year', 'academic_year_label', 'semester',
                  'year_of_study', 'status', 'total_credits', 'course_count',
                  'submitted_at', 'created_at']
