from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from academics.serializer.school import SchoolSerializer
from academics.models import School
from stars.utils.pagination import StandardResultsSetPagination
from rest_framework.filters import SearchFilter
from authentication.utils.permissions import IsStaffOrReadOnly
from authentication.utils.permissions import IsAuthorizedOrReadOnly
from rest_framework.response import Response
from rest_framework import status


class SchoolListView(ListAPIView):
    permission_classes =[IsStaffOrReadOnly]
    serializer_class = SchoolSerializer
    queryset = School.objects.all().order_by('name')
    pagination_class = StandardResultsSetPagination
    search_fields = ['name']
    filter_backends = [SearchFilter]

    def post(self, request):
        serializer = SchoolSerializer(data = request.data)
        if serializer.is_valid():
            serializer.save
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SchoolDetailView(APIView):
    permission_classes = [IsAuthorizedOrReadOnly]
    serializer_class = SchoolSerializer

    def get(self, request, id):
       school = School.objects.get(id=id)
       serializer = SchoolSerializer(school)
       return Response(serializer.data, status=status.HTTP_200_OK)