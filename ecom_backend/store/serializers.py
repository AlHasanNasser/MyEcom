from rest_framework import serializers
from .models import Category, Product, Order, OrderItem, Profile
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.utils.text import slugify

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['role', 'is_approved', 'age']

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "is_staff", "is_superuser", "profile"]

class ProductSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True
    )
    slug = serializers.SlugField(read_only=True) # Make slug read-only
    supplier = UserSerializer(read_only=True)

    class Meta:
        model = Product
        fields = ["id","name","slug","description","price","stock","image","category","category_id", "supplier"]

    def create(self, validated_data):
        # Generate slug if not provided (though it's read_only, this handles potential direct API calls)
        if 'slug' not in validated_data or not validated_data['slug']:
            validated_data['slug'] = slugify(validated_data['name'])
            # Ensure uniqueness for the generated slug
            original_slug = validated_data['slug']
            counter = 1
            while Product.objects.filter(slug=validated_data['slug']).exists():
                validated_data['slug'] = f"{original_slug}-{counter}"
                counter += 1
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # If name is updated, regenerate slug unless a slug is explicitly provided
        if 'name' in validated_data and 'slug' not in validated_data:
            validated_data['slug'] = slugify(validated_data['name'])
            # Ensure uniqueness for the generated slug during update
            original_slug = validated_data['slug']
            counter = 1
            while Product.objects.filter(slug=validated_data['slug']).exclude(pk=instance.pk).exists():
                validated_data['slug'] = f"{original_slug}-{counter}"
                counter += 1
        return super().update(instance, validated_data)

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    class Meta:
        model = OrderItem
        fields = ["id","product","quantity","price","subtotal"]

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()
    user = UserSerializer(read_only=True)

    class Meta:
        model = Order
        fields = ["id","user","created_at","status","is_seen","items","total"]

    def get_total(self, obj):
        return obj.total()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ("username", "password", "password2", "email", "first_name", "last_name")

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            password=validated_data["password"]
        )
        user.is_staff = False
        user.is_superuser = False
        user.save()
        return user
