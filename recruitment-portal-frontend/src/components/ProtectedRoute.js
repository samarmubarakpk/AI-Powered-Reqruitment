// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  // Check if user is logged in
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has the required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.userType)) {
    // Redirect to appropriate dashboard based on user type
    switch (currentUser.userType) {
      case 'candidate':
        return <Navigate to="/candidate/dashboard" replace />;
      case 'company':
        return <Navigate to="/company/dashboard" replace />;
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;