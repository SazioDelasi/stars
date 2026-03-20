from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from authentication.serializer.user import UserSerializer 
from authentication.models import User
from django.contrib.auth import authenticate
from authentication.utils.user import get_auth_for_user
from rest_framework.response import Response
from rest_framework import status

class LoginView(APIView):
    permission_classes = [AllowAny]
    serializer_class = UserSerializer
    
    def post(self, request): 
        email = request.data.get('email')
        password = request.data.get('password')
        try:
            user_object = User.objects.get(email=email)
            user = authenticate(username=user_object.username, password=password)
            res = get_auth_for_user(user)
            return Response(res, status=status.HTTP_200_OK )

        except User.DoesNotExist:
            return Response({'code':'auth/user-not-exist', 'message':'User does not exist or something'}, status=status.HTTP_400_BAD_REQUEST)
        
        