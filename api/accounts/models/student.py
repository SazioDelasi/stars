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
