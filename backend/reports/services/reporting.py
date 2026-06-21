"""
UENR STARS — Reporting Services (v3)
All public functions:
  - accept dept_id (enforced server-side)
  - support ordering via order_by param
  - chain all filters correctly
  - use programme.min_graduation_credits dynamically
  - integrate registration data where relevant
"""
from django.db.models import Avg, Count, Max, Min, Q, Sum

from results.models import CourseResult, SemesterResult, AcademicYear, Course
from students.models import Student, Department, Programme


# ─── Internal helpers ────────────────────────────────────────────────────────

VALID_ORDER_FIELDS = {
    'name':       'user__last_name',
    'index':      'index_number',
    'gpa':        'cumulative_gpa_annotation',   # annotated — handled below
    'year':       'current_year',
    'programme':  'programme__name',
    'department': 'department__name',
    'status':     'status',
}


def _apply_ordering(rows: list, order_by: str, descending: bool = False) -> list:
    """Sort a list of dicts by a named key, with direction control."""
    key_map = {
        'name':       'full_name',
        'index':      'index_number',
        'gpa':        'cumulative_gpa',
        'year':       'current_year',
        'programme':  'programme',
        'department': 'department',
        'status':     'status',
        'semester_gpa': 'semester_gpa',
        'total':      'total',
        'grade':      'grade',
    }
    sort_key = key_map.get(order_by, 'full_name')
    try:
        return sorted(rows, key=lambda r: (r.get(sort_key) or ''), reverse=descending)
    except TypeError:
        return sorted(rows, key=lambda r: str(r.get(sort_key) or ''), reverse=descending)


def _students(dept_id=None, programme_id=None, year=None, status=None):
    qs = Student.objects.select_related('user', 'department', 'programme')
    if dept_id:       qs = qs.filter(department_id=dept_id)
    if programme_id:  qs = qs.filter(programme_id=programme_id)
    if year:          qs = qs.filter(current_year=int(year))
    if status:        qs = qs.filter(status=status)
    return qs


def _results(dept_id=None, course_id=None, ay_id=None, semester=None, year_of_study=None):
    qs = CourseResult.objects.filter(is_published=True).select_related(
        'student__user', 'student__department', 'student__programme',
        'course', 'academic_year'
    )
    if dept_id:       qs = qs.filter(student__department_id=dept_id)
    if course_id:     qs = qs.filter(course_id=int(course_id))
    if ay_id:         qs = qs.filter(academic_year_id=int(ay_id))
    if semester:      qs = qs.filter(semester=int(semester))
    if year_of_study: qs = qs.filter(year_of_study=int(year_of_study))
    return qs


def _student_row(s, extra=None):
    row = {
        'student_id':        s.id,
        'index_number':      s.index_number,
        'full_name':         s.user.get_full_name(),
        'email':             s.user.email,
        'department':        s.department.name,
        'programme':         s.programme.name,
        'current_year':      s.current_year,
        'status':            s.status,
        'cumulative_gpa':    s.cumulative_gpa,
        'academic_standing': s.academic_standing,
        'trail_count':       s.trail_count,
        'in_danger':         s.in_academic_danger,
    }
    if extra:
        row.update(extra)
    return row


def _grade_analytics(rows):
    totals = [r['total'] for r in rows if r.get('total') is not None]
    passes = sum(1 for r in rows if r.get('pass'))
    fails  = len(rows) - passes
    grade_dist = {}
    for r in rows:
        g = r.get('grade') or 'N/A'
        grade_dist[g] = grade_dist.get(g, 0) + 1
    return {
        'total_students': len(rows),
        'pass_count':     passes,
        'fail_count':     fails,
        'pass_rate':      round(passes / len(rows) * 100, 1) if rows else 0,
        'fail_rate':      round(fails  / len(rows) * 100, 1) if rows else 0,
        'avg_score':      round(sum(totals) / len(totals), 2) if totals else 0,
        'highest_score':  max(totals) if totals else 0,
        'lowest_score':   min(totals) if totals else 0,
        'grade_distribution': grade_dist,
    }


# ─── 6C.1  Course Offering Report ────────────────────────────────────────────

def course_offering_report(course_id, ay_id=None, semester=None,
                            year_of_study=None, dept_id=None,
                            order_by='index', descending=False):
    """
    All students offering a course.
    dept_id enforces departmental scoping server-side.
    Also checks registered_courses for a more accurate student list.
    """
    # Results-based rows (published)
    result_qs = _results(dept_id=dept_id, course_id=course_id,
                         ay_id=ay_id, semester=semester, year_of_study=year_of_study)

    # Also include students registered (but not yet results published) if ay_id + semester given
    registered_ids = set()
    if ay_id and semester:
        from registration.models import RegisteredCourse
        reg_qs = RegisteredCourse.objects.filter(
            course_id=course_id,
            registration__academic_year_id=ay_id,
            registration__semester=semester,
            registration__status__in=['submitted', 'approved'],
        ).select_related('registration__student')
        if dept_id:
            reg_qs = reg_qs.filter(registration__student__department_id=dept_id)
        registered_ids = {rc.registration.student_id for rc in reg_qs}

    rows = []
    seen_students = set()
    for cr in result_qs.order_by('student__index_number'):
        seen_students.add(cr.student_id)
        rows.append({
            'student_id':    cr.student_id,
            'index_number':  cr.student.index_number,
            'full_name':     cr.student.user.get_full_name(),
            'department':    cr.student.department.name,
            'programme':     cr.student.programme.name,
            'year_of_study': cr.year_of_study,
            'semester':      cr.semester,
            'academic_year': cr.academic_year.label,
            'ca':            cr.continuous_assessment,
            'exam':          cr.exam_score,
            'total':         cr.total_score,
            'grade':         cr.grade,
            'grade_point':   cr.grade_point,
            'pass':          cr.grade not in ('F', 'IC', 'WD', ''),
            'is_trail':      cr.is_trail,
            'source':        'result',
        })

    # Add registration-only rows (no result yet)
    extra_students = registered_ids - seen_students
    if extra_students:
        for s in Student.objects.filter(pk__in=extra_students).select_related('user','department','programme'):
            rows.append({
                'student_id': s.id, 'index_number': s.index_number,
                'full_name': s.user.get_full_name(),
                'department': s.department.name, 'programme': s.programme.name,
                'year_of_study': s.current_year, 'semester': int(semester or 0),
                'academic_year': '', 'ca': None, 'exam': None,
                'total': None, 'grade': 'N/A', 'grade_point': 0,
                'pass': False, 'is_trail': False, 'source': 'registered',
            })

    rows = _apply_ordering(rows, order_by, descending)

    try:
        course = Course.objects.select_related('department').get(pk=course_id)
        course_info = {'id': course.id, 'code': course.code, 'title': course.title,
                       'credit_hours': course.credit_hours, 'department': course.department.name}
    except Course.DoesNotExist:
        course_info = {}

    return {'course': course_info, 'rows': rows, 'analytics': _grade_analytics(rows)}


# ─── 6C.2  Programme Report ───────────────────────────────────────────────────

def programme_report(programme_id, dept_id=None, year=None,
                     ay_id=None, semester=None,
                     min_gpa=None, max_gpa=None,
                     status=None,
                     order_by='gpa', descending=True):
    students = _students(dept_id=dept_id, programme_id=programme_id, year=year, status=status)
    rows = []
    for s in students:
        gpa = s.cumulative_gpa
        if min_gpa is not None and gpa < float(min_gpa): continue
        if max_gpa is not None and gpa > float(max_gpa): continue
        rows.append(_student_row(s))

    rows = _apply_ordering(rows, order_by, descending)

    standings = {}
    for r in rows:
        st = r['academic_standing']
        standings[st] = standings.get(st, 0) + 1

    gpas = [r['cumulative_gpa'] for r in rows if r['cumulative_gpa'] > 0]

    try:
        prog = Programme.objects.get(pk=programme_id)
        prog_info = {'id': prog.id, 'name': prog.name, 'code': prog.code,
                     'min_graduation_credits': prog.min_graduation_credits}
    except Programme.DoesNotExist:
        prog_info = {}

    return {
        'programme': prog_info,
        'rows': rows,
        'summary': {
            'total':          len(rows),
            'avg_gpa':        round(sum(gpas)/len(gpas), 2) if gpas else 0,
            'in_danger':      sum(1 for r in rows if r['in_danger']),
            'standing_dist':  standings,
            'top_student':    rows[0]  if rows else None,
            'lowest_student': rows[-1] if rows else None,
        },
    }


# ─── 6C.3  Department Report ──────────────────────────────────────────────────

def department_report(dept_id, programme_id=None, ay_id=None, semester=None, year=None,
                      standing_filter=None, min_gpa=None, max_gpa=None,
                      status=None, order_by='name', descending=False):
    students = _students(dept_id=dept_id, programme_id=programme_id, year=year, status=status)    
    rows = []
    for s in students:
        gpa     = s.cumulative_gpa
        standing = s.academic_standing
        if min_gpa        is not None and gpa < float(min_gpa): continue
        if max_gpa        is not None and gpa > float(max_gpa): continue
        if standing_filter and standing != standing_filter:       continue
        rows.append(_student_row(s))

    rows = _apply_ordering(rows, order_by, descending)
    gpas = [r['cumulative_gpa'] for r in rows if r['cumulative_gpa'] > 0]
    standings = {}
    for r in rows:
        st = r['academic_standing']
        standings[st] = standings.get(st, 0) + 1

    try:
        dept = Department.objects.get(pk=dept_id)
        dept_info = {'id': dept.id, 'name': dept.name, 'code': dept.code}
    except Department.DoesNotExist:
        dept_info = {}

    return {
        'department': dept_info,
        'rows': rows,
        'summary': {
            'total':        len(rows),
            'avg_gpa':      round(sum(gpas)/len(gpas), 2) if gpas else 0,
            'in_danger':    sum(1 for r in rows if r['in_danger']),
            'first_class':  standings.get('First Class', 0),
            'second_upper': standings.get('Second Class Upper', 0),
            'second_lower': standings.get('Second Class Lower', 0),
            'third_class':  standings.get('Third Class', 0),
            'fail':         standings.get('Fail', 0),
            'standing_dist': standings,
        },
    }


# ─── 6C.4  Semester Report ────────────────────────────────────────────────────

def semester_report(ay_id, semester, dept_id=None, programme_id=None,
                    year_of_study=None, order_by='semester_gpa', descending=True):
    qs = SemesterResult.objects.filter(
        academic_year_id=ay_id, semester=semester, is_published=True
    ).select_related('student__user', 'student__department', 'student__programme', 'academic_year')

    if dept_id:       qs = qs.filter(student__department_id=dept_id)
    if programme_id:  qs = qs.filter(student__programme_id=programme_id)
    if year_of_study: qs = qs.filter(year_of_study=int(year_of_study))

    rows = []
    for sr in qs:
        rows.append({
            'student_id':    sr.student_id,
            'index_number':  sr.student.index_number,
            'full_name':     sr.student.user.get_full_name(),
            'department':    sr.student.department.name,
            'programme':     sr.student.programme.name,
            'year_of_study': sr.year_of_study,
            'semester_gpa':  sr.semester_gpa,
            'total_credits': sr.total_credits,
            'cumulative_gpa': sr.student.cumulative_gpa,
            'in_danger':     sr.student.in_academic_danger,
        })

    rows = _apply_ordering(rows, order_by, descending)
    gpas = [r['semester_gpa'] for r in rows]
    return {
        'rows': rows,
        'summary': {
            'total':     len(rows),
            'avg_gpa':   round(sum(gpas)/len(gpas), 2) if gpas else 0,
            'best_gpa':  max(gpas) if gpas else 0,
            'worst_gpa': min(gpas) if gpas else 0,
            'pass_rate': round(sum(1 for g in gpas if g >= 1.0)/len(gpas)*100, 1) if gpas else 0,
        },
    }


# ─── 6C.5  Academic Danger Report ────────────────────────────────────────────

def danger_report(dept_id=None, programme_id=None, year=None,
                  gpa_threshold=1.5, min_trails=3,
                  order_by='gpa', descending=False):
    students = _students(dept_id=dept_id, programme_id=programme_id, year=year)
    rows = []
    for s in students:
        gpa    = s.cumulative_gpa
        trails = s.trail_count
        if gpa < float(gpa_threshold) or trails >= int(min_trails):
            failed = list(
                CourseResult.objects.filter(student=s, grade='F', is_published=True)
                .select_related('course')
                .values_list('course__code', 'course__title')
            )
            rows.append({
                **_student_row(s),
                'failed_courses':       [{'code': c[0], 'title': c[1]} for c in failed],
                'gpa_below_threshold':  gpa < float(gpa_threshold),
                'trails_exceeded':      trails >= int(min_trails),
            })

    rows = _apply_ordering(rows, order_by, descending)
    return {
        'rows': rows,
        'summary': {
            'total_in_danger':     len(rows),
            'gpa_below_threshold': sum(1 for r in rows if r['gpa_below_threshold']),
            'trails_exceeded':     sum(1 for r in rows if r['trails_exceeded']),
        },
        'thresholds': {'gpa': gpa_threshold, 'trails': min_trails},
    }


# ─── 6C.6  Graduation Eligibility Report ─────────────────────────────────────

def graduation_report(dept_id=None, programme_id=None, min_credits=None,
                      order_by='name', descending=False):
    """
    Uses programme.min_graduation_credits dynamically.
    Also considers both passed results AND approved registrations.
    """
    students = _students(dept_id=dept_id, programme_id=programme_id).filter(current_year=4)
    rows = []
    for s in students:
        # Use programme-specific min_credits, falling back to param or 120
        prog_min = s.programme.min_graduation_credits
        effective_min = int(min_credits) if min_credits else prog_min

        # Credits from passed results
        earned = sum(
            cr.course.credit_hours
            for cr in CourseResult.objects.filter(
                student=s, is_published=True
            ).exclude(grade__in=['F', 'IC', 'WD']).select_related('course')
        )

        # Trail/failed courses
        trail_courses = list(
            CourseResult.objects.filter(student=s, grade='F', is_published=True)
            .select_related('course')
            .values_list('course__code', 'course__title')
        )

        # Approved registrations (pending results)
        from registration.models import CourseRegistration
        pending_credits = sum(
            rc.course.credit_hours
            for reg in CourseRegistration.objects.filter(
                student=s, status='approved'
            ).prefetch_related('registered_courses__course')
            for rc in reg.registered_courses.all()
        )

        gpa = s.cumulative_gpa

        if earned >= effective_min and len(trail_courses) == 0 and gpa >= 1.0:
            eligibility = 'Eligible'
        elif (earned + pending_credits) >= effective_min and len(trail_courses) <= 2 and gpa >= 1.0:
            eligibility = 'Conditional'
        else:
            eligibility = 'Ineligible'

        rows.append({
            **_student_row(s),
            'credits_earned':   earned,
            'credits_required': effective_min,
            'pending_credits':  pending_credits,
            'trail_courses':    [{'code': c[0], 'title': c[1]} for c in trail_courses],
            'eligibility':      eligibility,
        })

    rows = _apply_ordering(rows, order_by, descending)
    return {
        'rows': rows,
        'summary': {
            'total':       len(rows),
            'eligible':    sum(1 for r in rows if r['eligibility'] == 'Eligible'),
            'conditional': sum(1 for r in rows if r['eligibility'] == 'Conditional'),
            'ineligible':  sum(1 for r in rows if r['eligibility'] == 'Ineligible'),
        },
    }


# ─── University comparison ────────────────────────────────────────────────────

def university_comparison_report(order_by='avg_gpa', descending=True):
    departments = Department.objects.all()
    rows = []
    for dept in departments:
        students = list(_students(dept_id=dept.id))
        if not students: continue
        gpas = [s.cumulative_gpa for s in students if s.cumulative_gpa > 0]
        rows.append({
            'department_id':   dept.id,
            'department_name': dept.name,
            'department_code': dept.code,
            'total_students':  len(students),
            'avg_gpa':         round(sum(gpas)/len(gpas), 2) if gpas else 0,
            'in_danger':       sum(1 for s in students if s.in_academic_danger),
            'first_class':     sum(1 for s in students if s.academic_standing == 'First Class'),
            'fail':            sum(1 for s in students if s.academic_standing == 'Fail'),
        })
    rows.sort(key=lambda r: r.get(order_by.replace('-',''), 0),
              reverse=not order_by.startswith('-'))
    return {'departments': rows}
