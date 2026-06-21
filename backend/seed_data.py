import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from students.models import Department, Programme, Student
from results.models import AcademicYear, Course, CourseResult, SemesterResult
from grievances.models import Grievance, GrievanceComment

User = get_user_model()

# Departments
cse = Department.objects.create(name='Computer Science and Engineering', code='CSE', faculty='Engineering')
ee = Department.objects.create(name='Electrical Engineering', code='EE', faculty='Engineering')

# Programmes
bsc_cs = Programme.objects.create(name='BSc Computer Science', code='BSCS', department=cse, duration_years=4)
bsc_ee = Programme.objects.create(name='BSc Electrical Engineering', code='BSEE', department=ee, duration_years=4)

# Academic Year
ay = AcademicYear.objects.create(label='2023/2024', is_current=True)
ay2 = AcademicYear.objects.create(label='2022/2023')

# Courses for CSE
c1 = Course.objects.create(code='CSE101', title='Introduction to Programming', credit_hours=3, department=cse, year=1, semester=1)
c2 = Course.objects.create(code='CSE102', title='Discrete Mathematics', credit_hours=3, department=cse, year=1, semester=1)
c3 = Course.objects.create(code='CSE103', title='Digital Logic Design', credit_hours=3, department=cse, year=1, semester=1)
c4 = Course.objects.create(code='CSE201', title='Data Structures and Algorithms', credit_hours=3, department=cse, year=2, semester=1)
c5 = Course.objects.create(code='CSE202', title='Object-Oriented Programming', credit_hours=3, department=cse, year=2, semester=1)
c6 = Course.objects.create(code='CSE203', title='Computer Organization', credit_hours=2, department=cse, year=2, semester=1)
c7 = Course.objects.create(code='CSE301', title='Database Systems', credit_hours=3, department=cse, year=3, semester=1)
c8 = Course.objects.create(code='CSE302', title='Operating Systems', credit_hours=3, department=cse, year=3, semester=1)
c9 = Course.objects.create(code='CSE303', title='Computer Networks', credit_hours=3, department=cse, year=3, semester=1)

# Exams Coordinator
ec_user = User.objects.create_user(
    username='exams_coord', password='stars2024',
    first_name='Kwame', last_name='Asante',
    email='kwame.asante@uenr.edu.gh', role='exams_coordinator'
)

# HoD
hod_user = User.objects.create_user(
    username='hod_cse', password='stars2024',
    first_name='Abena', last_name='Mensah',
    email='abena.mensah@uenr.edu.gh', role='hod', department=cse
)

# Students
def make_student(username, fname, lname, index, ref, dept, prog, yr, ay_admission, status='active'):
    u = User.objects.create_user(username=username, password='stars2024',
        first_name=fname, last_name=lname, email=f'{username}@st.uenr.edu.gh', role='student')
    s = Student.objects.create(user=u, index_number=index, reference_number=ref,
        department=dept, programme=prog, year_of_admission=ay_admission,
        current_year=yr, current_semester=1, status=status)
    return s

s1 = make_student('kofi_adu', 'Kofi', 'Adu', 'UEB2100123', 'REF001', cse, bsc_cs, 3, 2021)
s2 = make_student('ama_boateng', 'Ama', 'Boateng', 'UEB2100124', 'REF002', cse, bsc_cs, 3, 2021)
s3 = make_student('yaw_mensah', 'Yaw', 'Mensah', 'UEB2100125', 'REF003', cse, bsc_cs, 2, 2022, 'repeating')
s4 = make_student('akosua_frimpong', 'Akosua', 'Frimpong', 'UEB2100126', 'REF004', cse, bsc_cs, 3, 2021)
s5 = make_student('kweku_darko', 'Kweku', 'Darko', 'UEB2100127', 'REF005', cse, bsc_cs, 3, 2021)

# Add results for s1 (Year 1, Semester 1 - 2022/2023)
def add_result(student, course, acad_year, sem, yr_study, ca, exam, published=True):
    cr = CourseResult.objects.create(
        student=student, course=course, academic_year=acad_year,
        semester=sem, year_of_study=yr_study,
        continuous_assessment=ca, exam_score=exam, is_published=published
    )
    return cr

# s1 results - good student
add_result(s1, c1, ay2, 1, 1, 36, 55)
add_result(s1, c2, ay2, 1, 1, 32, 50)
add_result(s1, c3, ay2, 1, 1, 35, 48)
add_result(s1, c4, ay, 1, 2, 38, 57)
add_result(s1, c5, ay, 1, 2, 34, 52)
add_result(s1, c6, ay, 1, 2, 30, 45)

# s2 results - average student
add_result(s2, c1, ay2, 1, 1, 28, 38)
add_result(s2, c2, ay2, 1, 1, 25, 35)
add_result(s2, c3, ay2, 1, 1, 22, 28)  # This is a fail
add_result(s2, c4, ay, 1, 2, 30, 42)
add_result(s2, c5, ay, 1, 2, 26, 36)
add_result(s2, c6, ay, 1, 2, 24, 30)

# s3 results - repeating student (struggling)
add_result(s3, c1, ay2, 1, 1, 20, 28)  # fail
add_result(s3, c2, ay2, 1, 1, 18, 22)  # fail
add_result(s3, c3, ay2, 1, 1, 22, 30)
add_result(s3, c4, ay, 1, 2, 24, 28)
add_result(s3, c5, ay, 1, 2, 20, 25)

# s4 - first class student
add_result(s4, c1, ay2, 1, 1, 39, 58)
add_result(s4, c2, ay2, 1, 1, 38, 56)
add_result(s4, c3, ay2, 1, 1, 37, 55)
add_result(s4, c4, ay, 1, 2, 40, 58)
add_result(s4, c5, ay, 1, 2, 39, 57)
add_result(s4, c6, ay, 1, 2, 38, 56)

# s5 - some trail
add_result(s5, c1, ay2, 1, 1, 30, 42)
add_result(s5, c2, ay2, 1, 1, 26, 36)
add_result(s5, c3, ay2, 1, 1, 20, 22)  # fail
add_result(s5, c4, ay, 1, 2, 28, 38)
add_result(s5, c5, ay, 1, 2, 22, 28)   # borderline
add_result(s5, c6, ay, 1, 2, 24, 30)

# Compute semester summaries
for student in [s1, s2, s3, s4, s5]:
    for (yr, sem, ay_obj) in [(1, 1, ay2), (2, 1, ay)]:
        sr, _ = SemesterResult.objects.get_or_create(
            student=student, academic_year=ay_obj, semester=sem, year_of_study=yr
        )
        sr.is_published = True
        sr.recompute()

# Grievances
g1 = Grievance.objects.create(
    student=s2, grievance_type='grade', priority='high', status='open',
    subject='Grade dispute for CSE103',
    description='I believe my exam script for CSE103 was not marked correctly. I scored higher than what was recorded.',
    related_course=c3, related_academic_year=ay2, assigned_to=hod_user
)
GrievanceComment.objects.create(grievance=g1, author=hod_user, message='We have received your concern. Your script will be reviewed within 5 working days.', is_internal=False)

g2 = Grievance.objects.create(
    student=s3, grievance_type='result', priority='medium', status='in_review',
    subject='Missing CA marks for CSE202',
    description='My continuous assessment marks for CSE202 have not been entered into the system.',
    related_course=c5, related_academic_year=ay, assigned_to=hod_user
)
GrievanceComment.objects.create(grievance=g2, author=s3.user, message='It has been 2 weeks and my marks are still missing. Please urgently resolve this.', is_internal=False)
GrievanceComment.objects.create(grievance=g2, author=hod_user, message='Confirmed missing. Contacting the lecturer.', is_internal=True)

g3 = Grievance.objects.create(
    student=s5, grievance_type='registration', priority='low', status='resolved',
    subject='Unable to register for elective course',
    description='The system is not allowing me to add the elective course CSE305 to my registration.',
    related_academic_year=ay
)
GrievanceComment.objects.create(grievance=g3, author=ec_user, message='Registration issue resolved. You can now register for the course.', is_internal=False)
g3.status = 'resolved'
from django.utils import timezone
g3.resolved_at = timezone.now()
g3.save()

print("✅ Seed data created successfully!")
print(f"  Exams Coordinator: exams_coord / stars2024")
print(f"  HoD (CSE): hod_cse / stars2024")
print(f"  Students: kofi_adu, ama_boateng, yaw_mensah, akosua_frimpong, kweku_darko / stars2024")
