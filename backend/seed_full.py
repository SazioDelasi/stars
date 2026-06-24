import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from students.models import Department, Programme, Student
from results.models import AcademicYear, Course, CourseResult, SemesterResult
from grievances.models import Grievance, GrievanceComment
from django.utils import timezone

User = get_user_model()

# Wipe existing seed data safely
CourseResult.objects.all().delete()
SemesterResult.objects.all().delete()
Grievance.objects.all().delete()
Student.objects.all().delete()
Programme.objects.all().delete()
Course.objects.all().delete()
Department.objects.all().delete()
User.objects.exclude(is_superuser=True).delete()
AcademicYear.objects.all().delete()

print("Cleaned old data...")

# ── Academic Years ─────────────────────────────────────────────────
ay2122 = AcademicYear.objects.create(label='2021/2022')
ay2223 = AcademicYear.objects.create(label='2022/2023')
ay2324 = AcademicYear.objects.create(label='2023/2024', is_current=True)

# ── Departments ────────────────────────────────────────────────────
cse  = Department.objects.create(name='Computer Science and Engineering', code='CSE',  faculty='School of Sciences')
it   = Department.objects.create(name='Information Technology',           code='IT',   faculty='School of Sciences')
mth  = Department.objects.create(name='Mathematics',                      code='MTH',  faculty='School of Sciences')
stat = Department.objects.create(name='Statistics',                       code='STAT', faculty='School of Sciences')

# ── Programmes ─────────────────────────────────────────────────────
bscs = Programme.objects.create(name='BSc Computer Science', code='BSCS', department=cse, duration_years=4)
bsse = Programme.objects.create(name='BSc Software Engineering', code='BSSE', department=cse, duration_years=4)
bsit = Programme.objects.create(name='BSc Information Technology', code='BSIT', department=it, duration_years=4)
bscn = Programme.objects.create(name='BSc Computer Networking', code='BSCN', department=it, duration_years=4)
bsmt = Programme.objects.create(name='BSc Mathematics', code='BSMT', department=mth, duration_years=4)
bsst = Programme.objects.create(name='BSc Statistics', code='BSST', department=stat, duration_years=4)

# ── Courses — CSE ─────────────────────────────────────────────────
def mc(code, title, ch, dept, yr, sem):
    return Course.objects.create(code=code, title=title, credit_hours=ch, department=dept, year=yr, semester=sem)

# CSE Year 1
cc1 = mc('CSE101','Introduction to Programming',3,cse,1,1)
cc2 = mc('CSE102','Discrete Mathematics',3,cse,1,1)
cc3 = mc('CSE103','Digital Logic Design',3,cse,1,1)
cc4 = mc('CSE104','Calculus I',2,cse,1,1)
# CSE Year 2
cc5 = mc('CSE201','Data Structures and Algorithms',3,cse,2,1)
cc6 = mc('CSE202','Object-Oriented Programming',3,cse,2,1)
cc7 = mc('CSE203','Computer Organization',2,cse,2,1)
# CSE Year 3
cc8 = mc('CSE301','Database Systems',3,cse,3,1)
cc9 = mc('CSE302','Operating Systems',3,cse,3,1)
cc10= mc('CSE303','Computer Networks',3,cse,3,1)
# CSE Year 4
cc11= mc('CSE401','Software Engineering',3,cse,4,1)
cc12= mc('CSE402','Final Year Project',6,cse,4,2)

# IT Year 1-2
ci1 = mc('IT101','Intro to IT',3,it,1,1)
ci2 = mc('IT102','Web Technologies',3,it,1,1)
ci3 = mc('IT201','Database Management',3,it,2,1)
ci4 = mc('IT202','Network Administration',3,it,2,1)

# MTH Year 1-2
cm1 = mc('MTH101','Calculus I',3,mth,1,1)
cm2 = mc('MTH102','Linear Algebra',3,mth,1,1)
cm3 = mc('MTH201','Real Analysis',3,mth,2,1)
cm4 = mc('MTH202','Abstract Algebra',3,mth,2,1)

# STAT Year 1-2
cs1 = mc('STAT101','Intro to Statistics',3,stat,1,1)
cs2 = mc('STAT102','Probability Theory',3,stat,1,1)
cs3 = mc('STAT201','Statistical Inference',3,stat,2,1)
cs4 = mc('STAT202','Regression Analysis',3,stat,2,1)

print("Departments, Programmes, Courses created.")

# ── Staff Users ────────────────────────────────────────────────────
def mk_user(username, fname, lname, email, role, dept=None):
    u = User.objects.create_user(username=username, password='stars2024',
        first_name=fname, last_name=lname, email=email, role=role, department=dept)
    return u

admin = mk_user('portal_admin', 'Esi', 'Amoah', 'admin@uenr.edu.gh', 'administrator', None)
uni_coord = mk_user('uni_coord','Kwame','Asante','kwame.asante@uenr.edu.gh',
                    User.ROLE_UNIVERSITY_COORDINATOR)# University Coordinator

# HoDs
hod_cse  = mk_user('hod_cse', 'Abena','Mensah',  'abena.mensah@uenr.edu.gh',  User.ROLE_HOD, cse)
hod_it   = mk_user('hod_it',  'Kofi', 'Boateng', 'kofi.boateng@uenr.edu.gh',  User.ROLE_HOD, it)
hod_mth  = mk_user('hod_mth', 'Ama',  'Darko',   'ama.darko@uenr.edu.gh',     User.ROLE_HOD, mth)
hod_stat = mk_user('hod_stat','Yaw',  'Frimpong', 'yaw.frimpong@uenr.edu.gh',  User.ROLE_HOD, stat)

# Dept Coordinators
dc_cse  = mk_user('coord_cse', 'Efua','Asante',  'efua.asante@uenr.edu.gh',  User.ROLE_DEPT_COORDINATOR, cse)
dc_it   = mk_user('coord_it',  'Nana','Poku',    'nana.poku@uenr.edu.gh',    User.ROLE_DEPT_COORDINATOR, it)
dc_mth  = mk_user('coord_mth', 'Adwoa','Kusi',   'adwoa.kusi@uenr.edu.gh',   User.ROLE_DEPT_COORDINATOR, mth)
dc_stat = mk_user('coord_stat','Kweku','Owusu',  'kweku.owusu@uenr.edu.gh',  User.ROLE_DEPT_COORDINATOR, stat)

print("Staff users created.")

# ── Student factory ────────────────────────────────────────────────
def mk_student(username,fname,lname,idx,ref,dept,prog,yr,ay_adm,status='active'):
    u = mk_user(username, fname, lname, f'{username}@st.uenr.edu.gh', User.ROLE_STUDENT)
    s = Student.objects.create(user=u, index_number=idx, reference_number=ref,
        department=dept, programme=prog, year_of_admission=ay_adm,
        current_year=yr, current_semester=1, status=status, phone=f'024{idx[-7:]}')
    return s

# CSE students
s1 = mk_student('kofi_adu',     'Kofi',   'Adu',      'UEB2100101','REF001',cse,bscs,3,2021)
s2 = mk_student('ama_boateng',  'Ama',    'Boateng',  'UEB2100102','REF002',cse,bscs,3,2021)
s3 = mk_student('yaw_mensah',   'Yaw',    'Mensah',   'UEB2200103','REF003',cse,bscs,2,2022,'repeating')
s4 = mk_student('akosua_f',     'Akosua', 'Frimpong', 'UEB2100104','REF004',cse,bscs,3,2021)
s5 = mk_student('kweku_darko',  'Kweku',  'Darko',    'UEB2100105','REF005',cse,bscs,3,2021)
s6 = mk_student('abena_kusi',   'Abena',  'Kusi',     'UEB2000106','REF006',cse,bscs,4,2020)
s7 = mk_student('nana_asare',   'Nana',   'Asare',    'UEB2000107','REF007',cse,bscs,4,2020)

# Software Engineering students
s15 = mk_student('sazio_delasi', 'Sazio',  'Delasi',   'UEB2100501','REF015',cse,bsse,4,2022)
s16 = mk_student('kooli_nasir',   'Kooli',  'Nasir',    'UEB2200502','REF016',cse,bsse,4,2022)

# IT students
s8  = mk_student('efua_mensah',  'Efua',   'Mensah',  'UEB2100201','REF008',it,bsit,3,2021)
s9  = mk_student('kwame_poku',   'Kwame',  'Poku',    'UEB2100202','REF009',it,bsit,3,2021)
s10 = mk_student('adwoa_asante', 'Adwoa',  'Asante',  'UEB2200203','REF010',it,bsit,2,2022)

# Networking students
s17 = mk_student('rubby_exornam', 'Rubby',  'Exornam',  'UEB2100601','REF017',it,bscn,4,2022)

# MTH students
s11 = mk_student('kofi_owusu',  'Kofi',   'Owusu',   'UEB2100301','REF011',mth,bsmt,3,2021)
s12 = mk_student('ama_darko',   'Ama',    'Darko',   'UEB2100302','REF012',mth,bsmt,3,2021)

# STAT students
s13 = mk_student('yaw_boateng', 'Yaw',    'Boateng', 'UEB2100401','REF013',stat,bsst,3,2021)
s14 = mk_student('abena_adu',   'Abena',  'Adu',     'UEB2100402','REF014',stat,bsst,3,2021)

print(f"Created {Student.objects.count()} students.")

# ── Result factory ─────────────────────────────────────────────────
def add_result(student, course, ay, sem, yr_study, ca, exam, published=True):
    cr = CourseResult.objects.create(
        student=student, course=course, academic_year=ay,
        semester=sem, year_of_study=yr_study,
        continuous_assessment=ca, exam_score=exam, is_published=published,
    )
    return cr

def add_semester(student, ay, sem, yr_study):
    sr, _ = SemesterResult.objects.get_or_create(
        student=student, academic_year=ay, semester=sem, year_of_study=yr_study)
    sr.is_published = True
    sr.recompute()
    return sr

# ── CSE s1 (Kofi Adu) - first class ───────────────────────────────
add_result(s1,cc1,ay2122,1,1,38,57); add_result(s1,cc2,ay2122,1,1,36,55)
add_result(s1,cc3,ay2122,1,1,37,56); add_result(s1,cc4,ay2122,1,1,35,52)
add_semester(s1,ay2122,1,1)
add_result(s1,cc5,ay2223,1,2,39,58); add_result(s1,cc6,ay2223,1,2,38,57)
add_result(s1,cc7,ay2223,1,2,36,55)
add_semester(s1,ay2223,1,2)
add_result(s1,cc8,ay2324,1,3,40,58); add_result(s1,cc9,ay2324,1,3,39,57)
add_result(s1,cc10,ay2324,1,3,38,56)
add_semester(s1,ay2324,1,3)

# ── CSE s2 (Ama Boateng) - second lower + trail ────────────────────
add_result(s2,cc1,ay2122,1,1,28,38); add_result(s2,cc2,ay2122,1,1,25,35)
add_result(s2,cc3,ay2122,1,1,22,16); add_result(s2,cc4,ay2122,1,1,24,30)  # cc3 fail
add_semester(s2,ay2122,1,1)
add_result(s2,cc5,ay2223,1,2,30,42); add_result(s2,cc6,ay2223,1,2,26,36)
add_result(s2,cc7,ay2223,1,2,24,30)
add_semester(s2,ay2223,1,2)
add_result(s2,cc8,ay2324,1,3,28,38); add_result(s2,cc9,ay2324,1,3,26,35)
add_result(s2,cc10,ay2324,1,3,24,32)
add_semester(s2,ay2324,1,3)

# ── CSE s3 (Yaw Mensah) - in academic danger ──────────────────────
add_result(s3,cc1,ay2122,1,1,18,20); add_result(s3,cc2,ay2122,1,1,15,18)  # fails
add_result(s3,cc3,ay2122,1,1,20,22); add_result(s3,cc4,ay2122,1,1,16,18)  # fail
add_semester(s3,ay2122,1,1)
add_result(s3,cc5,ay2223,1,2,22,28); add_result(s3,cc6,ay2223,1,2,18,22)  # fail
add_result(s3,cc7,ay2223,1,2,20,24)
add_semester(s3,ay2223,1,2)

# ── CSE s4 (Akosua) - first class ─────────────────────────────────
for (c,ca,ex) in [(cc1,39,58),(cc2,38,57),(cc3,39,58),(cc4,37,55)]:
    add_result(s4,c,ay2122,1,1,ca,ex)
add_semester(s4,ay2122,1,1)
for (c,ca,ex) in [(cc5,40,59),(cc6,39,58),(cc7,38,56)]:
    add_result(s4,c,ay2223,1,2,ca,ex)
add_semester(s4,ay2223,1,2)
for (c,ca,ex) in [(cc8,40,58),(cc9,39,57),(cc10,40,58)]:
    add_result(s4,c,ay2324,1,3,ca,ex)
add_semester(s4,ay2324,1,3)

# ── CSE s5 (Kweku) - second upper ────────────────────────────────
for (c,ca,ex) in [(cc1,33,48),(cc2,30,45),(cc3,28,42),(cc4,31,46)]:
    add_result(s5,c,ay2122,1,1,ca,ex)
add_semester(s5,ay2122,1,1)
for (c,ca,ex) in [(cc5,34,50),(cc6,32,48),(cc7,30,44)]:
    add_result(s5,c,ay2223,1,2,ca,ex)
add_semester(s5,ay2223,1,2)
for (c,ca,ex) in [(cc8,35,52),(cc9,33,50),(cc10,32,48)]:
    add_result(s5,c,ay2324,1,3,ca,ex)
add_semester(s5,ay2324,1,3)

# ── CSE Year 4 students (s6, s7) ─────────────────────────────────
for (c,ca,ex) in [(cc1,35,52),(cc2,32,48),(cc3,34,50),(cc4,30,45)]:
    add_result(s6,c,ay2122,1,1,ca,ex); add_result(s7,c,ay2122,1,1,ca+2,ex+3)
add_semester(s6,ay2122,1,1); add_semester(s7,ay2122,1,1)
for (c,ca,ex) in [(cc5,36,53),(cc6,34,51),(cc7,32,48)]:
    add_result(s6,c,ay2223,1,2,ca,ex); add_result(s7,c,ay2223,1,2,ca+1,ex+2)
add_semester(s6,ay2223,1,2); add_semester(s7,ay2223,1,2)
for (c,ca,ex) in [(cc8,37,54),(cc9,35,52),(cc10,36,53)]:
    add_result(s6,c,ay2324,1,3,ca,ex); add_result(s7,c,ay2324,1,3,ca+2,ex+2)
add_semester(s6,ay2324,1,3); add_semester(s7,ay2324,1,3)

# CSE Year 4 students (s15, s16) - Software Engineering
for (c,ca,ex) in [(cc11,39,57),(cc12,40,58)]:
    add_result(s15,c,ay2324,1,4,ca,ex);

for (c,ca,ex) in [(cc11,35,57),(cc12,40,55)]:
    add_result(s16,c,ay2324,1,4,ca,ex); 

# ── IT students ────────────────────────────────────────────────────
for (c,ca,ex) in [(ci1,34,50),(ci2,32,48)]:
    add_result(s8,c,ay2122,1,1,ca,ex); add_result(s9,c,ay2122,1,1,ca-4,ex-5); add_result(s17,c,ay2122,1,1,ca-4,ex-5)
add_semester(s8,ay2122,1,1); add_semester(s9,ay2122,1,1)
for (c,ca,ex) in [(ci3,33,49),(ci4,31,46)]:
    add_result(s8,c,ay2223,1,2,ca,ex); add_result(s9,c,ay2223,1,2,ca-3,ex-4)
add_semester(s8,ay2223,1,2); add_semester(s9,ay2223,1,2)
add_result(s10,ci1,ay2223,1,1,28,40); add_result(s10,ci2,ay2223,1,1,26,38)
add_semester(s10,ay2223,1,1)

# IT Year 4 student (s17) - Networking

# ── MTH students ──────────────────────────────────────────────────
for (c,ca,ex) in [(cm1,38,56),(cm2,36,54)]:
    add_result(s11,c,ay2122,1,1,ca,ex); add_result(s12,c,ay2122,1,1,ca-3,ex-4)
add_semester(s11,ay2122,1,1); add_semester(s12,ay2122,1,1)
for (c,ca,ex) in [(cm3,37,55),(cm4,35,53)]:
    add_result(s11,c,ay2223,1,2,ca,ex); add_result(s12,c,ay2223,1,2,ca-2,ex-3)
add_semester(s11,ay2223,1,2); add_semester(s12,ay2223,1,2)

# ── STAT students ─────────────────────────────────────────────────
for (c,ca,ex) in [(cs1,35,52),(cs2,33,50)]:
    add_result(s13,c,ay2122,1,1,ca,ex); add_result(s14,c,ay2122,1,1,ca-2,ex-3)
add_semester(s13,ay2122,1,1); add_semester(s14,ay2122,1,1)
for (c,ca,ex) in [(cs3,36,53),(cs4,34,51)]:
    add_result(s13,c,ay2223,1,2,ca,ex); add_result(s14,c,ay2223,1,2,ca-1,ex-2)
add_semester(s13,ay2223,1,2); add_semester(s14,ay2223,1,2)

print(f"Created {CourseResult.objects.count()} results, {SemesterResult.objects.count()} semester summaries.")

# ── Grievances ─────────────────────────────────────────────────────
g1 = Grievance.objects.create(
    student=s2, grievance_type='grade', priority='high', status='open',
    subject='Grade dispute for CSE103 Digital Logic Design',
    description='I believe my exam script for CSE103 was not marked correctly. My working was correct but the mark recorded (16) does not match the mark on my script.',
    related_course=cc3, related_academic_year=ay2122, assigned_to=dc_cse
)
GrievanceComment.objects.create(grievance=g1, author=dc_cse,
    message='We have received your concern. Your script will be reviewed within 5 working days.', is_internal=False)
GrievanceComment.objects.create(grievance=g1, author=dc_cse,
    message='Confirmed with lecturer — script being re-marked.', is_internal=True)

g2 = Grievance.objects.create(
    student=s3, grievance_type='result', priority='medium', status='in_review',
    subject='Missing CA marks for CSE202',
    description='My continuous assessment marks for CSE202 Object-Oriented Programming have not been entered. I submitted all assignments and scored above 80% on the midterm.',
    related_course=cc6, related_academic_year=ay2223, assigned_to=dc_cse
)
GrievanceComment.objects.create(grievance=g2, author=dc_cse,
    message='We are investigating. Please provide your assignment submission receipts.', is_internal=False)

g3 = Grievance.objects.create(
    student=s5, grievance_type='registration', priority='low', status='resolved',
    subject='Unable to register for CSE303 elective',
    description='The system is blocking my registration for CSE303 Computer Networks.',
    related_academic_year=ay2324
)
GrievanceComment.objects.create(grievance=g3, author=uni_coord,
    message='Registration issue resolved. The system has been updated. You can now register.', is_internal=False)
g3.status = 'resolved'; g3.resolved_at = timezone.now(); g3.save()

g4 = Grievance.objects.create(
    student=s8, grievance_type='grade', priority='high', status='open',
    subject='Exam score discrepancy in IT102',
    description='My exam score for IT102 Web Technologies shows 30 but my exam sheet shows 48. I have a photo of my marked script.',
    related_course=ci2, related_academic_year=ay2122, assigned_to=dc_it
)

print(f"Created {Grievance.objects.count()} grievances.")

# ── Summary ────────────────────────────────────────────────────────
print("\n✅ Full seed complete!")
print("\nDEPARTMENTS:")
for d in Department.objects.all():
    print(f"  {d.code}: {d.name} ({d.students.count()} students)")

print("\nSTAFF ACCOUNTS (all password: stars2024):")
print("  uni_coord       — University Exams Coordinator (full access)")
print("  hod_cse         — HoD Computer Science")
print("  hod_it          — HoD Information Technology")
print("  hod_mth         — HoD Mathematics")
print("  hod_stat        — HoD Statistics")
print("  coord_cse       — Dept Coordinator CSE")
print("  coord_it        — Dept Coordinator IT")
print("  coord_mth       — Dept Coordinator MTH")
print("  coord_stat      — Dept Coordinator STAT")

print("\nSTUDENT ACCOUNTS (all password: stars2024):")
for s in Student.objects.all():
    print(f"  {s.user.username:20} — {s.index_number} | GPA:{s.cumulative_gpa:.2f} | {s.academic_standing} | Danger:{s.in_academic_danger}")

# ── Post-seed: add lecturers, mark electives, create offerings ─────────────
from results.models import Lecturer, CourseOffering

print("\nAdding lecturers and course offerings...")

# Mark some courses as electives
Course.objects.filter(code__in=['CSE303', 'CSE402']).update(is_core=False)
Course.objects.filter(code__in=['IT202', 'MTH202', 'STAT202']).update(is_core=True)
# CSE lecturers
l1 = Lecturer.objects.create(first_name='Kwame', last_name='Asante', title='Dr.',
     email='k.asante@uenr.edu.gh', department=cse)
l2 = Lecturer.objects.create(first_name='Abena', last_name='Kusi', title='Mr.',
     email='a.kusi@uenr.edu.gh', department=cse)
l3 = Lecturer.objects.create(first_name='Nana', last_name='Poku', title='Prof.',
     email='n.poku@uenr.edu.gh', department=cse)

# IT lecturers
l4 = Lecturer.objects.create(first_name='Efua', last_name='Mensah', title='Dr.',
     email='e.mensah@uenr.edu.gh', department=it)
l5 = Lecturer.objects.create(first_name='Kofi', last_name='Darko', title='Mr.',
     email='k.darko@uenr.edu.gh', department=it)

# MTH lecturers
l6 = Lecturer.objects.create(first_name='Ama', last_name='Boateng', title='Prof.',
     email='a.boateng@uenr.edu.gh', department=mth)

# STAT lecturers
l7 = Lecturer.objects.create(first_name='Yaw', last_name='Frimpong', title='Dr.',
     email='y.frimpong@uenr.edu.gh', department=stat)

# Create CourseOfferings for current academic year
offerings_data = [
    (cc1, 1, l1), (cc2, 1, l2), (cc3, 1, l3), (cc4, 1, l2),
    (cc5, 1, l1), (cc6, 1, l3), (cc7, 1, l2),
    (cc8, 1, l1), (cc9, 1, l3), (cc10, 1, l2),
    (cc11, 1, l1), (cc12, 2, l3),
    (ci1, 1, l4), (ci2, 1, l5), (ci3, 1, l4), (ci4, 1, l5),
    (cm1, 1, l6), (cm2, 1, l6), (cm3, 1, l6), (cm4, 1, l6),
    (cs1, 1, l7), (cs2, 1, l7), (cs3, 1, l7), (cs4, 1, l7),
]
for course_obj, sem_num, lecturer_obj in offerings_data:
    CourseOffering.objects.get_or_create(
        course=course_obj, academic_year=ay2324, semester=sem_num,
        defaults={'lecturer': lecturer_obj, 'max_students': 150}
    )

print(f"Created {Lecturer.objects.count()} lecturers, {CourseOffering.objects.count()} offerings")
print(f"Elective courses: {Course.objects.filter(is_core=False).values_list('code', flat=True)}")

# ── Post-seed v6: ElectivePools + updated grievances ─────────────────────────
from results.models import ElectivePool, ElectivePoolCourse
from grievances.models import Grievance, GrievanceComment

print("\nSetting up elective pools...")

# CSE Year 3, Semester 1 — 2023/2024
pool_cse_y3s1 = ElectivePool.objects.create(
    name='CSE Year 3 Sem 1 Electives',
    department=cse, programme=bscs,
    year_of_study=3, semester=1,
    academic_year=ay2324,
    max_electives=1, max_elective_credits=3,
    is_active=True, created_by=hod_cse,
)
# CSE303 (Computer Networks) is an elective at Year 3
cse303 = Course.objects.get(code='CSE303')
ElectivePoolCourse.objects.create(pool=pool_cse_y3s1, course=cse303, added_by=hod_cse)

# IT Year 2, Semester 1 — elective pool
pool_it_y2s1 = ElectivePool.objects.create(
    name='IT Year 2 Sem 1 Electives',
    department=it, programme=bsit,
    year_of_study=2, semester=1,
    academic_year=ay2324,
    max_electives=1, max_elective_credits=3,
    is_active=True, created_by=hod_it,
)
it202 = Course.objects.get(code='IT202')
ElectivePoolCourse.objects.create(pool=pool_it_y2s1, course=it202, added_by=hod_it)

print(f"Created {ElectivePool.objects.count()} elective pools, {ElectivePoolCourse.objects.count()} pool entries")

# ── Updated grievances with auto-priority ─────────────────────────────────────
Grievance.objects.all().delete()
GrievanceComment.objects.all().delete()
print("Re-creating grievances with auto-priority...")

g1 = Grievance(
    student=s2, grievance_type='grade',
    subject='Grade dispute for CSE103 Digital Logic Design',
    description='I believe my exam script for CSE103 was not marked correctly. My working was correct but the mark recorded (16) does not match the mark on my script.',
    related_course=cc3, related_academic_year=ay2122,
)
g1.save()  # priority auto-classified as HIGH (grade type)
GrievanceComment.objects.create(grievance=g1, author=dc_cse,
    message='We have received your concern. Your script will be reviewed within 5 working days.', is_internal=False)
GrievanceComment.objects.create(grievance=g1, author=dc_cse,
    message='Confirmed with lecturer — script being re-marked.', is_internal=True)

g2 = Grievance(
    student=s3, grievance_type='result',
    subject='Missing CA marks for CSE202',
    description='My continuous assessment marks for CSE202 Object-Oriented Programming have not been entered. I submitted all assignments and scored above 80% on the midterm.',
    related_course=cc6, related_academic_year=ay2223,
)
g2.save()  # AUTO HIGH (result type)
g2.status = 'in_review'; g2.save()
GrievanceComment.objects.create(grievance=g2, author=dc_cse,
    message='We are investigating. Please provide your assignment submission receipts.', is_internal=False)

g3 = Grievance(
    student=s5, grievance_type='portal',
    subject='Unable to access the student portal',
    description='The portal keeps logging me out and I cannot view my timetable.',
    related_academic_year=ay2324,
)
g3.save()  # AUTO MEDIUM (portal type)
g3.status = 'resolved'; from django.utils import timezone as tz; g3.resolved_at = tz.now(); g3.save()
GrievanceComment.objects.create(grievance=g3, author=uni_coord,
    message='Portal access restored. Please clear your browser cache and try again.', is_internal=False)

g4 = Grievance(
    student=s8, grievance_type='grade',
    subject='Exam score discrepancy in IT102',
    description='My exam score for IT102 Web Technologies shows 30 but my exam sheet shows 48.',
    related_course=ci2, related_academic_year=ay2122,
)
g4.save()  # AUTO HIGH

g5 = Grievance(
    student=s1, grievance_type='feedback',
    subject='Suggestion for library opening hours',
    description='It would be very helpful if the library could stay open until 10pm on weekdays.',
)
g5.save()  # AUTO LOW

print(f"Created {Grievance.objects.count()} grievances:")
for g in Grievance.objects.all():
    print(f"  #{g.id} [{g.priority.upper()}] {g.grievance_type}: {g.subject[:50]}")
    print(f"       Assigned to: {g.assigned_to} | Deadline: {g.response_deadline.strftime('%Y-%m-%d') if g.response_deadline else 'None'}")

# ── Elective pools ─────────────────────────────────────────────────────────
from results.models import ElectivePool, ElectivePoolCourse

print("Creating elective pools...")

pool_data = [
    {'dept':cse, 'prog':bscs, 'yr':3, 'sem':2, 'name':'CSE Y3S2 Electives',
     'max_el':1, 'max_cr':3, 'courses':['CSE303'], 'staff':hod_cse},
    {'dept':cse, 'prog':bscs, 'yr':4, 'sem':2, 'name':'CSE Y4S2 Electives',
     'max_el':1, 'max_cr':6, 'courses':['CSE402'], 'staff':hod_cse},
]

for pd in pool_data:
    pool, _ = ElectivePool.objects.get_or_create(
        department=pd['dept'], programme=pd['prog'],
        year_of_study=pd['yr'], semester=pd['sem'], academic_year=ay2324,
        defaults={
            'name': pd['name'],
            'max_electives': pd['max_el'],
            'max_elective_credits': pd['max_cr'],
            'created_by': pd['staff'],
        }
    )
    for code in pd['courses']:
        try:
            c = Course.objects.get(code=code)
            ElectivePoolCourse.objects.get_or_create(pool=pool, course=c,
                defaults={'added_by': pd['staff']})
        except Course.DoesNotExist:
            pass

print(f"Elective pools: {ElectivePool.objects.count()}, courses: {ElectivePoolCourse.objects.count()}")
