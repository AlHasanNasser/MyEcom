from rest_framework import permissions

class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user and request.user.is_staff:
            return True
        return obj.supplier == request.user

class IsApprovedSupplierOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow approved suppliers or admin users to access.
    """

    def has_permission(self, request, view):
        # Allow admin users to perform any action
        if request.user and request.user.is_staff:
            return True

        # Allow approved suppliers to perform specific actions (e.g., update order status)
        if request.user and request.user.is_authenticated and hasattr(request.user, 'profile'):
            if request.user.profile.role == 'Supplier' and request.user.profile.is_approved:
                # For now, allow approved suppliers to access if they are authenticated and approved.
                # Further view-level checks might be needed for specific actions.
                return True
        return False

    def has_object_permission(self, request, view, obj):
        # Object-level permissions are not strictly needed for this use case (updating status on an order)
        # but can be added if suppliers should only update *their own* orders.
        # For now, assuming approved suppliers can update any order status.
        if request.user and request.user.is_staff:
            return True

        if request.user and request.user.is_authenticated and hasattr(request.user, 'profile'):
            if request.user.profile.role == 'Supplier' and request.user.profile.is_approved:
                return obj.supplier == request.user
        return False
