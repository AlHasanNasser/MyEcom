from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User

from .models import Category, Product, Order, OrderItem, Profile

# Register your models here.

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    prepopulated_fields = {"slug": ("name",)}

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name","price","stock","category")
    prepopulated_fields = {"slug": ("name",)}

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    readonly_fields = ("subtotal",)

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id","user","created_at","status")
    inlines = [OrderItemInline]

class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'profile'

class UserAdmin(BaseUserAdmin):
    inlines = (ProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'profile_role', 'profile_approved')

    def profile_role(self, obj):
        return obj.profile.role
    profile_role.short_description = 'Role'

    def profile_approved(self, obj):
        return obj.profile.is_approved
    profile_approved.boolean = True
    profile_approved.short_description = 'Approved'

admin.site.unregister(User)
admin.site.register(User, UserAdmin)
