from django.db import models
from authentication.models import User
from academics.models import Programme


# Create your models here.
class Student(models.Model):
    class Session(models.TextChoices):
        FULL_TIME = "FULL_TIME", "Full Time"
        WEEKEND = "WEEKEND", "Weekend"

    class FeePayment(models.TextChoices):
        REGULAR = "REGULAR", "Regular"
        FEE_PAYING = "FEE_PAYING", "Fee Paying"

    class Status(models.TextChoices):
        NORMAL = "NORMAL", "Normal"
        REPEATED = "REPEATED", "Repeated"
        DEFERRED = "DEFERRED", "Deferred"

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    index_number = models.CharField(unique=True, max_length=10)
    programme = models.ForeignKey(Programme, on_delete=models.SET_NULL, null=True)
    level = models.PositiveIntegerField(default=100)
    enrollment_year = models.PositiveIntegerField()
    session = models.CharField(max_length=10, choices=Session.choices)
    fee_payment = models.CharField(max_length=10, choices=FeePayment.choices)
    status = models.CharField(max_length=10, choices=Status.choices)

    @property
    def registration_status(self):
        """
        Returns the current registration state:
        'NOT_STARTED', 'PENDING', 'REGISTERED', or 'REJECTED'
        """
        from registry.models import Registration, Semester

        current_semester = Semester.objects.filter(is_current=True).first()
        if not current_semester:
            return "NO_ACTIVE_SEMESTER"

        reg = Registration.objects.filter(
            student=self, semester=current_semester.id
        ).first()

        if not reg:
            return "NOT_STARTED"

        status_map = {
            Registration.Status.DRAFT: "NOT_STARTED",
            Registration.Status.PENDING: "PENDING",
            Registration.Status.APPROVED: "FULLY_REGISTERED",
            Registration.Status.REJECTED: "REJECTED",
        }

        return status_map.get(reg.status, "UNKNOWN")
