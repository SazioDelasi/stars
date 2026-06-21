from rest_framework import serializers
from .models import AcademicYear, Course, CourseResult, SemesterResult, GRADE_POINTS, Lecturer, CourseOffering, ElectivePool, ElectivePoolCourse


class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = '__all__'


class CourseSerializer(serializers.ModelSerializer):
    department_name  = serializers.CharField(source='department.name',      read_only=True)
    programme_name   = serializers.CharField(source='programme.name',       read_only=True)
    equivalent_code  = serializers.CharField(source='equivalent_to.code',   read_only=True)
    lecturer_name    = serializers.SerializerMethodField()
    lecturer_email   = serializers.SerializerMethodField()

    class Meta:
        model  = Course
        fields = '__all__'
        read_only_fields = ['department']  

    def _current_offering(self, obj):
        try:
            ay = AcademicYear.objects.get(is_current=True)
            return CourseOffering.objects.select_related('lecturer').get(
                course=obj, academic_year=ay)
        except (AcademicYear.DoesNotExist, CourseOffering.DoesNotExist):
            return None

    def get_lecturer_name(self, obj):
        o = self._current_offering(obj)
        return o.lecturer.full_name if o and o.lecturer else 'TBA'

    def get_lecturer_email(self, obj):
        o = self._current_offering(obj)
        return o.lecturer.email if o and o.lecturer else ''


class CourseResultSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    credit_hours = serializers.IntegerField(source='course.credit_hours', read_only=True)
    academic_year_label = serializers.CharField(source='academic_year.label', read_only=True)
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_index = serializers.CharField(source='student.index_number', read_only=True)

    class Meta:
        model = CourseResult
        fields = '__all__'
        read_only_fields = ['grade', 'grade_point', 'total_score', 'entered_by', 'entered_at']

    def create(self, validated_data):
        validated_data['entered_by'] = self.context['request'].user
        return super().create(validated_data)


class CourseResultBulkSerializer(serializers.Serializer):
    """For bulk result entry by HoD"""
    results = CourseResultSerializer(many=True)

    def create(self, validated_data):
        results_data = validated_data['results']
        created = []
        for result_data in results_data:
            result_data['entered_by'] = self.context['request'].user
            obj, _ = CourseResult.objects.update_or_create(
                student=result_data['student'],
                course=result_data['course'],
                academic_year=result_data['academic_year'],
                semester=result_data['semester'],
                defaults=result_data
            )
            created.append(obj)
        return created


class SemesterResultSerializer(serializers.ModelSerializer):
    academic_year_label = serializers.CharField(source='academic_year.label', read_only=True)
    student_index = serializers.CharField(source='student.index_number', read_only=True)

    class Meta:
        model = SemesterResult
        fields = '__all__'


class StudentTranscriptSerializer(serializers.Serializer):
    """Full academic transcript for a student"""
    student_info = serializers.DictField()
    semesters = serializers.ListField()
    cumulative_gpa = serializers.FloatField()
    academic_standing = serializers.CharField()
    total_credits_earned = serializers.IntegerField()
    trail_count = serializers.IntegerField()


class LecturerSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Lecturer
        fields = ['id', 'full_name', 'title', 'first_name', 'last_name',
                  'email', 'department', 'department_name', 'is_active']


class CourseOfferingPublicSerializer(serializers.ModelSerializer):
    course_code        = serializers.CharField(source='course.code',          read_only=True)
    course_title       = serializers.CharField(source='course.title',         read_only=True)
    credit_hours       = serializers.IntegerField(source='course.credit_hours', read_only=True)
    is_core            = serializers.BooleanField(source='course.is_core',    read_only=True)
    academic_year_label= serializers.CharField(source='academic_year.label',  read_only=True)
    lecturer_name      = serializers.CharField(source='lecturer.full_name',   read_only=True)
    lecturer_email     = serializers.CharField(source='lecturer.email',       read_only=True)
    enrolled_count     = serializers.IntegerField(read_only=True)

    class Meta:
        model  = CourseOffering
        fields = ['id', 'course', 'course_code', 'course_title', 'credit_hours',
                  'is_core', 'academic_year', 'academic_year_label', 'semester',
                  'lecturer', 'lecturer_name', 'lecturer_email',
                  'max_students', 'enrolled_count', 'notes']


class ElectivePoolCourseSerializer(serializers.ModelSerializer):
    course_code  = serializers.CharField(source='course.code',         read_only=True)
    course_title = serializers.CharField(source='course.title',        read_only=True)
    credit_hours = serializers.IntegerField(source='course.credit_hours', read_only=True)
    added_by_name= serializers.CharField(source='added_by.get_full_name', read_only=True)

    class Meta:
        model  = ElectivePoolCourse
        fields = ['id', 'course', 'course_code', 'course_title', 'credit_hours',
                  'added_by_name', 'added_at']


class ElectivePoolSerializer(serializers.ModelSerializer):
    pool_courses        = ElectivePoolCourseSerializer(many=True, read_only=True)
    department_name     = serializers.CharField(source='department.name',      read_only=True)
    programme_name      = serializers.CharField(source='programme.name',       read_only=True)
    academic_year_label = serializers.CharField(source='academic_year.label',  read_only=True)
    created_by_name     = serializers.CharField(source='created_by.get_full_name', read_only=True)
    course_count        = serializers.IntegerField(source='pool_courses.count',  read_only=True)

    class Meta:
        model  = ElectivePool
        fields = ['id', 'name', 'department', 'department_name', 'programme', 'programme_name',
                  'year_of_study', 'semester', 'academic_year', 'academic_year_label',
                  'max_electives', 'max_elective_credits', 'is_active',
                  'course_count', 'pool_courses', 'created_by_name', 'created_at', 'updated_at']
        read_only_fields = ['created_by', 'created_at', 'updated_at']
