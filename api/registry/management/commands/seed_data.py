import random

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from academics.models import (
    HOD,
    Course,
    Dean,
    Department,
    Programme,
    ProgrammeCourse,
    ProgrammeRequirement,
    School,
)
from accounts.models.student import Student
from registry.models import AcademicSession, Semester

User = get_user_model()


class Command(BaseCommand):
    help = "Seeds the database with a full University hierarchy"

    def handle(self, *args, **kwargs):
        self.stdout.write("--- Starting University Seed (2026) ---")

        try:
            with transaction.atomic():
                self._cleanup()

                session, _ = AcademicSession.objects.get_or_create(
                    year="2025/2026", is_current=True
                )

                start = timezone.now().date()
                end = start + timezone.timedelta(days=120)  # 4 months later
                deadline = timezone.now() + timezone.timedelta(days=30)

                semester, _ = Semester.objects.get_or_create(
                    session=session,
                    number=1,
                    is_current=True,
                    defaults={
                        "start_date": start,
                        "end_date": end,  # <--- This fixes the NOT NULL constraint
                        "registration_deadline": deadline,
                    },
                )

                dean_eng_user = self._create_base_user(
                    "dean_eng",
                    "Robert",
                    "Smith",
                    User.Role.DEAN,
                    User.Title.PROF,
                    "+233200000000",
                    User.Gender.MALE,
                )
                dean_eng_profile = Dean.objects.create(user=dean_eng_user)
                eng_school = School.objects.create(
                    name="School of Engineering"
                )

                # --- Science ---
                dean_sci_user = self._create_base_user(
                    "dean_sci",
                    "Sarah",
                    "Lovelace",
                    User.Role.DEAN,
                    User.Title.DR,
                    "+233200000009",
                    User.Gender.FEMALE,
                )
                dean_sci_profile = Dean.objects.create(user=dean_sci_user)
                sci_school = School.objects.create(name="School of Science")

                # Create HODs and Departments
                # --- Computer Engineering ---
                hod_cpe_user = self._create_base_user(
                    "hod_cpe",
                    "James",
                    "Watt",
                    User.Role.HOD,
                    User.Title.DR,
                    "+233200000001",
                    User.Gender.MALE,
                )
                hod_cpe_profile = HOD.objects.create(user=hod_cpe_user)
                comp_dept = Department.objects.create(
                    name="Computer Engineering",
                    prefix="CPE",
                    school=eng_school,
                    hod=hod_cpe_profile,
                )

                # --- Mathematics ---
                hod_mth_user = self._create_base_user(
                    "hod_mth",
                    "Isaac",
                    "Newton",
                    User.Role.HOD,
                    User.Title.PROF,
                    "+233200000002",
                    User.Gender.MALE,
                )
                hod_mth_profile = HOD.objects.create(user=hod_mth_user)
                math_dept = Department.objects.create(
                    name="Mathematics",
                    prefix="MTH",
                    school=sci_school,
                    hod=hod_mth_profile,
                )

                comp_prog, _ = Programme.objects.get_or_create(
                    name="BSc. Computer Engineering", 
                    department=comp_dept,
                    defaults={
                        "duration": 4,
                        "required_credit": 140, # Total credits to graduate
                        "degree_type": Programme.DegreeType.BSC, # Adjust to BENG if you add it
                        "degree_level": Programme.DegreeLevel.UNDERGRADUATE
                    }
                )

                math_prog, _ = Programme.objects.get_or_create(
                    name="BSc. Mathematics", 
                    department=math_dept,
                    defaults={
                        "duration": 4,
                        "required_credit": 120,
                        "degree_type": Programme.DegreeType.BSC,
                        "degree_level": Programme.DegreeLevel.UNDERGRADUATE
                    }
                )

                msc_comp, _ = Programme.objects.get_or_create(
                    name="MSc. Computer Science",
                    department=comp_dept,
                    defaults={
                        "duration": 2,
                        "required_credit": 45,
                        "degree_type": Programme.DegreeType.MSC,
                        "degree_level": Programme.DegreeLevel.MASTERS
                    }
                )

                # Create Courses
                mth101 = Course.objects.create(
                    name="Algebra", code="MTH101", credits=3, department=math_dept
                )
                cpe101 = Course.objects.create(
                    name="Intro to Programming",
                    code="CPE101",
                    credits=4,
                    department=comp_dept,
                )

                # Map them to the ProgrammeCourse Catalog
                ProgrammeCourse.objects.create(
                    programme=comp_prog,
                    course=mth101,
                    session=session,
                    semester=1,
                    level=100,
                    course_type="CORE",
                )
                ProgrammeCourse.objects.create(
                    programme=comp_prog,
                    course=cpe101,
                    session=session,
                    semester=1,
                    level=100,
                    course_type="CORE",
                )

                # 6. Create Students
                self._seed_student(
                    "kofimensah",
                    "Kofi",
                    "Mensah",
                    comp_prog,
                    "001",
                    User.Title.MR,
                    "+233240000001",
                    User.Gender.MALE,
                )
                self._seed_student(
                    "amaabeo",
                    "Ama",
                    "Abeo",
                    math_prog,
                    "001",
                    User.Title.MRS,
                    "+233241111112",
                    User.Gender.FEMALE,
                )

                self.stdout.write(
                    self.style.SUCCESS("--- Seed Completed Successfully ---")
                )

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Seed failed: {str(e)}"))

    def _cleanup(self):
        """Wipes the database for a fresh start."""
        self.stdout.write("Cleaning database...")
        # Clear profiles first due to OneToOne links
        Student.objects.all().delete()
        HOD.objects.all().delete()
        Dean.objects.all().delete()
        # Clear structures
        ProgrammeCourse.objects.all().delete()
        Course.objects.all().delete()
        Programme.objects.all().delete()
        Department.objects.all().delete()
        School.objects.all().delete()
        Semester.objects.all().delete()
        AcademicSession.objects.all().delete()
        # Clear Users except Superusers
        User.objects.exclude(is_superuser=True).delete()

    def _create_base_user(self, username, first, last, role, title, phone, gender):
        user = User.objects.create(
            username=username,
            first_name=first,
            last_name=last,
            role=role,
            title=title,
            phone=phone,
            gender=gender,
            email=f"{username}@uenr.edu.gh",
        )
        user.set_password("pass123")
        user.save()
        return user

    def _seed_student(self, username, first, last, prog, suffix, title, phone, gender):
        user = self._create_base_user(
            username, first, last, User.Role.STUDENT, title, phone, gender
        )
        index_no = f"{prog.department.prefix}0{suffix}26"

        Student.objects.create(
            user=user,
            index_number=index_no,
            programme=prog,
            level=100,
            enrollment_year=2026,
            session=Student.Session.FULL_TIME,
            fee_payment=Student.FeePayment.REGULAR,
            status=Student.Status.NORMAL,
        )
