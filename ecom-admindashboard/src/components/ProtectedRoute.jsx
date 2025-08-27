import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function ProtectedRoute() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>; // Or a spinner
  }

  // Check if user is logged in and has a profile
  if (!user || !user.profile) {
    return <Navigate to="/login" replace />;
  }

  // Allow access if user is Admin
  if (user.profile.role === 'Admin') {
    return <Outlet />;
  }

  // Allow access if user is an Approved Supplier
  if (user.profile.role === 'Supplier' && user.profile.is_approved) {
    return <Outlet />;
  }

  // Otherwise, redirect to login
  return <Navigate to="/login" replace />;
}
