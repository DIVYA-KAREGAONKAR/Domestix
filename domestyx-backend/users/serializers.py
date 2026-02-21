from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import WorkerProfile
# users/serializers.py
from rest_framework import serializers
from .models import WorkerProfile


User = get_user_model()
class WorkerProfileSerializer(serializers.ModelSerializer):
    # We define these explicitly as ReadOnly so Django doesn't 
    # try to save them into the WorkerProfile MySQL table.
    first_name = serializers.ReadOnlyField(source='user.first_name')
    last_name = serializers.ReadOnlyField(source='user.last_name')
    email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = WorkerProfile
        # List ONLY the fields that exist in your WorkerProfile model
        # plus the three ReadOnly fields we defined above.
        fields = [
            'id', 'first_name', 'last_name', 'email', 'phone', 'address', 
            'city', 'state', 'zip_code', 'country', 'bio', 'hourly_rate', 
            'experience', 'services', 'availability', 'languages', 
            'has_transportation', 'has_references', 'is_background_checked', 
            'profile_image'
        ]
# -----------------------------
# Register Serializer
# -----------------------------
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'password2', 'first_name', 'last_name', 'role')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password']
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
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        data['user'] = {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
        }
        return data

# -----------------------------
# Worker Profile Serializer
# -----------------------------
class WorkerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkerProfile
        fields = [
            "first_name",
            "last_name",
            "email",
            "hourly_rate",
            "years_of_experience",
            "state",
            "country",      # new field
            "zip_code",
            "profile_image" # for image upload
        ]
        read_only_fields = ["user"]
