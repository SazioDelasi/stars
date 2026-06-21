"""
Batch result upload service.
Accepts a file object (CSV or XLSX), validates every row,
and returns a summary dict. Saves are transactional.
"""
import io
import csv
import openpyxl
from django.db import transaction
from results.models import CourseResult, AcademicYear, Course, SemesterResult
from students.models import Student


REQUIRED_COLUMNS = {'index_number', 'course_code', 'ca', 'exam', 'semester', 'academic_year'}


def _parse_csv(file_bytes):
    text = file_bytes.decode('utf-8-sig')
    reader = csv.DictReader(io.StringIO(text))
    return [row for row in reader]


def _parse_xlsx(file_bytes):
    wb = openpyxl.load_workbook(io.BytesIO(file_bytes), read_only=True, data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return []
    headers = [str(h).strip().lower().replace(' ', '_') if h else '' for h in rows[0]]
    result = []
    for row in rows[1:]:
        if all(v is None for v in row):
            continue
        result.append({headers[i]: (str(row[i]).strip() if row[i] is not None else '') for i in range(len(headers))})
    return result


def process_batch_upload(file_bytes, filename, entered_by, dept_id=None):
    """
    Parse, validate, and save a batch of results.
    Returns {success, failed, errors, preview} dict.
    """
    ext = filename.rsplit('.', 1)[-1].lower()
    if ext == 'csv':
        raw_rows = _parse_csv(file_bytes)
    elif ext in ('xlsx', 'xls'):
        raw_rows = _parse_xlsx(file_bytes)
    else:
        return {'success': 0, 'failed': 0, 'errors': [{'row': 0, 'error': 'Unsupported file type. Use CSV or XLSX.'}], 'preview': []}

    # Validate headers
    if raw_rows:
        cols = set(k.lower().strip() for k in raw_rows[0].keys())
        missing = REQUIRED_COLUMNS - cols
        if missing:
            return {
                'success': 0, 'failed': 0,
                'errors': [{'row': 0, 'error': f'Missing columns: {", ".join(missing)}'}],
                'preview': [],
            }

    validated = []
    errors = []

    for i, row in enumerate(raw_rows, start=2):
        r = {k.lower().strip(): v for k, v in row.items()}
        row_errors = []

        # Validate student
        idx = r.get('index_number', '').strip()
        try:
            student = Student.objects.get(index_number=idx)
            if dept_id and student.department_id != int(dept_id):
                row_errors.append('Student does not belong to your department.')
        except Student.DoesNotExist:
            student = None
            row_errors.append(f'Student with index "{idx}" not found.')

        # Validate course
        code = r.get('course_code', '').strip()
        try:
            course = Course.objects.get(code=code)
            if dept_id and course.department_id != int(dept_id):
                row_errors.append('Course does not belong to your department.')
        except Course.DoesNotExist:
            course = None
            row_errors.append(f'Course "{code}" not found.')

        # Validate academic year
        ay_label = r.get('academic_year', '').strip()
        try:
            academic_year = AcademicYear.objects.get(label=ay_label)
        except AcademicYear.DoesNotExist:
            academic_year = None
            row_errors.append(f'Academic year "{ay_label}" not found.')

        # Validate scores
        try:
            ca = float(r.get('ca', ''))
            if not (0 <= ca <= 40):
                row_errors.append(f'CA score {ca} out of valid range 0-40.')
        except (ValueError, TypeError):
            ca = None
            row_errors.append('CA score must be a number.')

        try:
            exam = float(r.get('exam', ''))
            if not (0 <= exam <= 60):
                row_errors.append(f'Exam score {exam} out of valid range 0-60.')
        except (ValueError, TypeError):
            exam = None
            row_errors.append('Exam score must be a number.')

        try:
            semester = int(r.get('semester', ''))
        except (ValueError, TypeError):
            semester = None
            row_errors.append('Semester must be 1 or 2.')

        year_of_study = r.get('year_of_study', '').strip()
        try:
            year_of_study = int(year_of_study) if year_of_study else (student.current_year if student else 1)
        except (ValueError, TypeError):
            year_of_study = 1

        if row_errors:
            errors.append({'row': i, 'index_number': idx, 'course_code': code, 'errors': row_errors})
        else:
            # Check duplicate
            exists = CourseResult.objects.filter(
                student=student, course=course,
                academic_year=academic_year, semester=semester
            ).exists()
            validated.append({
                'student': student, 'course': course, 'academic_year': academic_year,
                'semester': semester, 'year_of_study': year_of_study,
                'ca': ca, 'exam': exam,
                'duplicate': exists,
                'row': i, 'index_number': idx, 'course_code': code,
            })

    # Save valid, non-duplicate rows transactionally
    saved = 0
    duplicates = 0
    with transaction.atomic():
        for v in validated:
            if v['duplicate']:
                duplicates += 1
                continue
            cr = CourseResult(
                student=v['student'], course=v['course'],
                academic_year=v['academic_year'], semester=v['semester'],
                year_of_study=v['year_of_study'],
                continuous_assessment=v['ca'], exam_score=v['exam'],
                is_published=False, entered_by=entered_by,
            )
            cr.save()
            saved += 1

    preview = [
        {
            'row': v['row'], 'index_number': v['index_number'],
            'course_code': v['course_code'],
            'ca': v['ca'], 'exam': v['exam'],
            'status': 'duplicate' if v['duplicate'] else 'queued',
        }
        for v in validated
    ]

    return {
        'success':    saved,
        'duplicates': duplicates,
        'failed':     len(errors),
        'errors':     errors,
        'preview':    preview,
        'total_rows': len(raw_rows),
    }
