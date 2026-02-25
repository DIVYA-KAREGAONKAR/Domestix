from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import WorkerProfile
# users/serializers.py
from rest_framework import serializers
from .models import WorkerProfile
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

# users/serializers.py

# users/serializers.py

# users/serializers.py

class WorkerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkerProfile
        fields = [
            "phone", "address", "city", "state", "zip_code", "country",
            "bio", "hourly_rate", "experience", "services", 
            "availability", "languages", "has_transportation", 
            "has_references", "is_background_checked", "profile_image"
        ]
        read_only_fields = ["user"]
# Register Serializer
# -----------------------------
# users/serializers.py

# users/serializers.py

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    # ✅ This Meta class MUST be inside RegisterSerializer
    class Meta:
        model = User
        fields = ('email', 'password', 'password2', 'first_name', 'last_name', 'role')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        # ✅ Ensure 'role' is passed here to fix the redirect issue we discussed
        user = User.objects.create_user(
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password'],
            role=validated_data.get('role', 'worker') 
        )
        return user
# -----------------------------
# Profile Serializer
# -----------------------------
class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role')
        read_only_fields = fields

# -----------------------------
# JWT Custom Serializer
# -----------------------------


# ... (WorkerProfileSerializer and RegisterSerializer stay the same)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # This is where the 'role' is sent to React
        data = super().validate(attrs)
        user = self.user
        data['user'] = {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,  # ✅ This is the critical line for redirects
        }
        return data