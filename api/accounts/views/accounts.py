from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from accounts.serializer.student import StudentSerializer

class MeView (APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = StudentSerializer