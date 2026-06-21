from rest_framework import viewsets
from authentication.models import User
from authentication.utils.permissions import HasRole
from authentication.serializers.user import UserListSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserListSerializer
    permission_classes = [HasRole]
    allowed_roles = ["ADMIN"]