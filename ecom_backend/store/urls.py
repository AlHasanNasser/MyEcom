from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, CategoryViewSet, OrderViewSet, create_order, current_user , register_user, ProductSearchView, WorkerRegistrationView, WorkerApprovalView, UserProfileUpdateView, ChangePasswordView, SupplierRequestView, UserListView, UserDeleteView, UserOrderListView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r"products", ProductViewSet, basename="product")
router.register(r"categories", CategoryViewSet)
router.register(r"orders", OrderViewSet, basename="orders")

urlpatterns = [
    path("products/search/", ProductSearchView.as_view(), name="product-search"),
    path("", include(router.urls)),
    path("create-order/", create_order, name="create-order"),
    path("my-orders/", UserOrderListView.as_view(), name="my-orders"),
    path("users/me/", current_user, name="current-user"),
    path("users/register/", register_user, name="register-user"),
    path("users/workers/register/", WorkerRegistrationView.as_view(), name="worker-register"),
    path("users/workers/<int:pk>/approve/", WorkerApprovalView.as_view(), name="worker-approve"),
    path("users/me/update/", UserProfileUpdateView.as_view(), name="user-profile-update"),
    path("users/change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("users/request-supplier/", SupplierRequestView.as_view(), name="request-supplier"),
    path("users/", UserListView.as_view(), name="user-list"),
    path("users/<int:pk>/delete/", UserDeleteView.as_view(), name="user-delete"),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
