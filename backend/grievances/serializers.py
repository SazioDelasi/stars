from rest_framework import serializers
from .models import Grievance, GrievanceComment, GrievancePriorityLog


class GrievanceCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    author_role = serializers.CharField(source='author.role', read_only=True)
    class Meta:
        model = GrievanceComment
        fields = ['id','grievance','author','author_name','author_role','message','is_internal','created_at']
        read_only_fields = ['author','created_at']
    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class GrievancePriorityLogSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)
    class Meta:
        model = GrievancePriorityLog
        fields = ['id','old_priority','new_priority','reason','changed_by_name','changed_at']


class GrievanceSerializer(serializers.ModelSerializer):
    student_name         = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_index        = serializers.CharField(source='student.index_number', read_only=True)
    department_name      = serializers.CharField(source='student.department.name', read_only=True)
    assigned_to_name     = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    related_course_code  = serializers.CharField(source='related_course.code', read_only=True)
    related_course_title = serializers.CharField(source='related_course.title', read_only=True)
    comments             = GrievanceCommentSerializer(many=True, read_only=True)
    comment_count        = serializers.IntegerField(source='comments.count', read_only=True)
    priority_logs        = GrievancePriorityLogSerializer(many=True, read_only=True)
    days_until_deadline  = serializers.SerializerMethodField()
    is_overdue           = serializers.SerializerMethodField()

    class Meta:
        model = Grievance
        fields = '__all__'
        read_only_fields = ['priority','status','created_at','updated_at','resolved_at',
                            'assigned_to','response_deadline','priority_set_by',
                            'priority_override_reason']

    def get_days_until_deadline(self, obj):
        if not obj.response_deadline: return None
        from django.utils import timezone
        return max(0, (obj.response_deadline - timezone.now()).days)

    def get_is_overdue(self, obj):
        if not obj.response_deadline: return False
        from django.utils import timezone
        return timezone.now() > obj.response_deadline and obj.status not in ('resolved','rejected')


class GrievanceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grievance
        fields = ['student','grievance_type','subject','description',
                  'related_course','related_academic_year']


class GrievanceListSerializer(serializers.ModelSerializer):
    student_name     = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_index    = serializers.CharField(source='student.index_number', read_only=True)
    department_name  = serializers.CharField(source='student.department.name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    comment_count    = serializers.IntegerField(source='comments.count', read_only=True)
    is_overdue       = serializers.SerializerMethodField()
    days_until_deadline = serializers.SerializerMethodField()

    class Meta:
        model = Grievance
        fields = ['id','student','student_name','student_index','department_name',
                  'grievance_type','priority','status','subject','assigned_to',
                  'assigned_to_name','comment_count','response_deadline',
                  'days_until_deadline','is_overdue','created_at','updated_at']

    def get_is_overdue(self, obj):
        if not obj.response_deadline: return False
        from django.utils import timezone
        return timezone.now() > obj.response_deadline and obj.status not in ('resolved','rejected')

    def get_days_until_deadline(self, obj):
        if not obj.response_deadline: return None
        from django.utils import timezone
        return max(0, (obj.response_deadline - timezone.now()).days)
