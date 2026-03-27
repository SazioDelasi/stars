from django.db import models
from authentication.models import User


class Dean(models.Model):
    user =models.OneToOneField(User, on_delete=models.CASCADE)