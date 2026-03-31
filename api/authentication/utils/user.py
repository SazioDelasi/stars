from authentication.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from authentication.serializers.user import UserSerializer

def get_auth_for_user(user):
    if not user:
        raise User.DoesNotExist
    refresh = RefreshToken.for_user(user)
    return {
        "user":UserSerializer(user).data,
        "tokens": {
            "refresh": str (refresh),
            "access": str (refresh.access_token)
        }

    }