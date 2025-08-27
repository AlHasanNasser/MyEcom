from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from .models import Category, Product, Order, OrderItem, Profile
from .serializers import CategorySerializer, ProductSerializer, OrderSerializer, UserSerializer, RegisterSerializer, ProfileSerializer
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.generics import ListAPIView, RetrieveUpdateAPIView
from django.db.models import Q
import functools
import operator
from rest_framework.views import APIView
from django.contrib.auth.hashers import make_password
from .permissions import IsApprovedSupplierOrAdmin, IsOwnerOrAdmin


@api_view(["POST"])
@permission_classes([AllowAny])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        if hasattr(user, 'profile'):
            user.profile.is_approved = True
            user.profile.save()
        return Response({"detail": "User registered successfully."}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

from rest_framework.parsers import MultiPartParser, FormParser

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@method_decorator(csrf_exempt, name='dispatch')
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by("-created_at")
    serializer_class = ProductSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action == 'create':
            permission_classes = [IsApprovedSupplierOrAdmin]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsOwnerOrAdmin]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        serializer.save(supplier=self.request.user)


class ProductSearchView(ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        query = self.request.query_params.get('q', '')
        if not query:
            return Product.objects.none()

        query_words = query.split()
        
        search_queries = []
        for word in query_words:
            search_queries.append(Q(name__icontains=word))
            search_queries.append(Q(description__icontains=word))
            search_queries.append(Q(category__name__icontains=word))

        if search_queries:
            return Product.objects.filter(functools.reduce(operator.or_, search_queries)).distinct()
        
        return Product.objects.none()


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Order.objects.all().order_by("-created_at")
        if hasattr(user, 'profile') and user.profile.role == 'Supplier':
            return Order.objects.filter(supplier=user).order_by("-created_at")
        return Order.objects.filter(user_id=user.id).order_by("-created_at")

    def get_permissions(self):
        if self.action == 'update_status':
            permission_classes = [IsApprovedSupplierOrAdmin]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        status_data = request.data.get('status')
        if status_data not in [choice[0] for choice in Order.STATUS_CHOICES]:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        order.status = status_data
        order.save()
        return Response(OrderSerializer(order).data)


class UserOrderListView(ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by("-created_at")

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_order(request):
    data = request.data
    items = data.get("items", [])
    # Determine the supplier for the order
    order_supplier = None
    if items:
        first_product_id = items[0].get("product_id")
        if first_product_id:
            try:
                first_product = Product.objects.get(id=first_product_id)
                order_supplier = first_product.supplier
            except Product.DoesNotExist:
                pass # Handle error or log

    order = Order.objects.create(user=request.user, supplier=order_supplier) # ADD supplier=order_supplier
    for it in items:
        product = get_object_or_404(Product, id=it["product_id"])
        qty = int(it.get("quantity", 1))
        OrderItem.objects.create(order=order, product=product, quantity=qty, price=product.price)
        product.stock = max(product.stock - qty, 0)
        product.save()
    serializer = OrderSerializer(order, context={"request": request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)

class WorkerRegistrationView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')

        if not all([username, password]):
            return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            user.is_staff = True
            user.save()

            if hasattr(user, 'profile'):
                user.profile.role = 'Supplier'
                user.profile.is_approved = False
                user.profile.save()
            else:
                Profile.objects.create(user=user, role='Supplier', is_approved=False)

            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class WorkerApprovalView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')

        if not hasattr(user, 'profile') or user.profile.role != 'Supplier':
            return Response({'error': 'User is not a supplier or has no profile'}, status=status.HTTP_400_BAD_REQUEST)

        if action == 'approve':
            user.profile.is_approved = True
            user.profile.save()
            return Response({'detail': 'Supplier approved successfully'}, status=status.HTTP_200_OK)
        elif action == 'reject':
            user.profile.is_approved = False
            user.profile.save()
            return Response({'detail': 'Supplier rejected successfully'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid action. Must be "approve" or "reject"'}, status=status.HTTP_400_BAD_REQUEST)

class UserProfileUpdateView(RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        user = serializer.save()
        profile_data = self.request.data.get('profile', {})
        if profile_data:
            profile_serializer = ProfileSerializer(user.profile, data=profile_data, partial=True)
            profile_serializer.is_valid(raise_exception=True)
            profile_serializer.save()

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not user.check_password(old_password):
            return Response({'old_password': ['Wrong password.']}, status=status.HTTP_400_BAD_REQUEST)

        user.password = make_password(new_password)
        user.save()
        return Response({'detail': 'Password updated successfully'}, status=status.HTTP_200_OK)

class SupplierRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        age = request.data.get('age')

        if not age:
            return Response({'error': 'Age is required for supplier request.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not hasattr(user, 'profile'):
            Profile.objects.create(user=user)

        if user.profile.role == 'Supplier':
            return Response({'detail': 'You are already a supplier.'}, status=status.HTTP_200_OK)
        
        if user.profile.role == 'Admin':
            return Response({'detail': 'Admins cannot request supplier status.'}, status=status.HTTP_400_BAD_REQUEST)

        user.profile.role = 'Supplier'
        user.profile.is_approved = False
        user.profile.age = age
        user.profile.save()

        return Response({'detail': 'Supplier request submitted successfully. Awaiting admin approval.'}, status=status.HTTP_200_OK)

class UserListView(ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

class UserDeleteView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if user.is_superuser:
            return Response({'error': 'Cannot delete superuser'}, status=status.HTTP_403_FORBIDDEN)

        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
