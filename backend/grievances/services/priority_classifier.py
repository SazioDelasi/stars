HIGH_PRIORITY_TYPES = {'result','registration','grade','graduation','transcript'}
MEDIUM_PRIORITY_TYPES = {'timetable','portal','lecturer'}
HIGH_KEYWORDS = [
    'missing result','missing grade','wrong gpa','incorrect gpa','cannot graduate',
    'graduation','transcript error','registration failed','registration error',
    'cannot register','blocked registration','wrong mark','incorrect mark',
    'missing mark','wrong score','missing score','failed incorrectly','wrong grade',
    'incomplete result','carry-over','carryover','trail error','repeating wrongly',
]
MEDIUM_KEYWORDS = ['timetable clash','lecturer','portal','login','access denied',
    'cannot login','system error','password','account']
ROUTING_MAP = {
    'result':'dept_coordinator','grade':'dept_coordinator','transcript':'university_coordinator',
    'graduation':'university_coordinator','registration':'dept_coordinator',
    'timetable':'hod','lecturer':'hod','portal':'university_coordinator',
    'feedback':'hod','other':'hod',
}

def classify_priority(grievance_type, subject, description):
    text = (subject + ' ' + description).lower()
    if grievance_type in HIGH_PRIORITY_TYPES:
        return 'high'
    for kw in HIGH_KEYWORDS:
        if kw in text:
            return 'high'
    if grievance_type in MEDIUM_PRIORITY_TYPES:
        return 'medium'
    for kw in MEDIUM_KEYWORDS:
        if kw in text:
            return 'medium'
    return 'low'

def auto_assign(grievance_type, student):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    target_role = ROUTING_MAP.get(grievance_type, 'hod')
    dept = student.department
    candidate = User.objects.filter(role=target_role, department=dept, is_active=True).first()
    if candidate:
        return candidate
    return User.objects.filter(role__in=['hod','dept_coordinator'], department=dept, is_active=True).first()
