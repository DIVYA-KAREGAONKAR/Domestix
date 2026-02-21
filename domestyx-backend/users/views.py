from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser # Add JSONParser

from .serializers import (
    RegisterSerializer, ProfileSerializer,
    CustomTokenObtainPairSerializer, WorkerProfileSerializer
)
from .models import WorkerProfile

# -----------------------------
# Register User
# -----------------------------
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(ProfileSerializer(user).data)

# -----------------------------
# JWT Login
# -----------------------------
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

# -----------------------------
# General Profile
# -----------------------------
class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProfileSerializer

    def get_object(self):
        return self.request.user

# -----------------------------
# Worker Profile
# -----------------------------
# users/views.py


# users/views.py


@api_view(["GET", "PUT"])
@permission_classes([permissions.IsAuthenticated])
@parser_classes([JSONParser, MultiPartParser, FormParser]) # <--- Add JSONParser here
def worker_profile(request):
    # This line ensures the profile exists in MySQL before we try to edit it
    profile, _ = WorkerProfile.objects.get_or_create(user=request.user)

    if request.method == "PUT":
        # partial=True allows us to update just one field (like bio) 
        # without needing to send the whole form.
        serializer = WorkerProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        # If there is a validation error, we send it to the React Toast
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # GET request logic
    serializer = WorkerProfileSerializer(profile)
    return Response(serializer.data)

# Optional separate endpoint for image upload (if you want dedicated endpoint)
@api_view(["PUT"])
@permission_classes([permissions.IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_worker_image(request):
    profile, _ = WorkerProfile.objects.get_or_create(user=request.user)
    image = request.FILES.get('profile_image')  # key must match serializer field

    if not image:
        return Response({"error": "No image file provided"}, status=400)

    profile.profile_image = image
    profile.save()
    return Response({
        "message": "Image uploaded successfully",
        "image_url": profile.profile_image.url
    })

